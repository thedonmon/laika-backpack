'use server'

import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import { Connection, PublicKey } from '@solana/web3.js'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { Flipside } from '@flipsidecrypto/sdk'

// Initialize `Flipside` with your API key
const flipside = new Flipside(
  process.env.FLIPSIDE_KEY!,
  "https://api-v2.flipsidecrypto.xyz"
);
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET_KEY!)
const connection = new Connection(process.env.RPC_URL!);

export async function generateVerificationToken(userId: string, signature: string) {
  const token = await new SignJWT({ 
    userId,
    signature,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('5m')
    .setIssuedAt()
    .sign(SECRET_KEY)
  
  cookies().set('verification_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 300
  })

  return token
} 

interface BridgeResult {
  amount: number;
  bridge_date: number;
  ethPrice: number;
  usdValue: number;
  status: 'none' | 'pending' | 'partial' | 'complete';
  message: string;
}

export async function checkBridgeBalance(userId: string): Promise<BridgeResult> {
  const sql = `
    WITH transfers AS (
      SELECT
        s.tx_to AS receiving_wallet,
        MIN(s.block_timestamp) AS first_transfer_timestamp,
        MAX(s.block_timestamp) AS last_transfer_timestamp,
        COUNT(*) AS number_of_transfers,
        SUM(s.amount :: FLOAT / POWER(10, s.decimal)) AS total_amount_transferred
      FROM
        eclipse.core.fact_transfers as s
      WHERE
        s.tx_from = 'CrfbABN2sSvmoZLu9eDDfXpaC2nHg42R7AXbHs9eg4S9'
        AND s.mint = 'Eth1111111111111111111111111111111111111111'
      GROUP BY
        s.tx_to
    ),
    price_at_transfer AS (
      SELECT 
        t.*,
        AVG(p.price) as avg_eth_price,
        (t.total_amount_transferred * AVG(p.price)) as estimated_usd_value
      FROM transfers t
      LEFT JOIN ethereum.price.ez_prices_hourly p
        ON p.HOUR BETWEEN DATEADD(hour, -1, t.last_transfer_timestamp) 
        AND DATEADD(hour, 1, t.last_transfer_timestamp)
        AND p.symbol = 'ETH'
        AND p.is_native = true
        AND p.is_deprecated = false
      GROUP BY
        t.receiving_wallet,
        t.first_transfer_timestamp,
        t.last_transfer_timestamp,
        t.number_of_transfers,
        t.total_amount_transferred
    )
    SELECT
      receiving_wallet,
      last_transfer_timestamp,
      total_amount_transferred as eth_amount,
      avg_eth_price,
      estimated_usd_value,
      CASE 
        WHEN estimated_usd_value >= 490 THEN true 
        ELSE false 
      END as meets_threshold
    FROM
      price_at_transfer
    WHERE 
      receiving_wallet = '${userId}' AND last_transfer_timestamp >= last_transfer_timestamp >= '11/20/2024'
    ORDER BY
      last_transfer_timestamp DESC;
  `;

  try {
    const queryResultSet = await flipside.query.run({sql: sql, maxAgeMinutes: 5});
    
    if (!queryResultSet?.records?.length) {
      return {
        amount: 0,
        bridge_date: 0,
        ethPrice: 0,
        usdValue: 0,
        status: 'pending',
        message: 'If you recently bridged, please note it may take 20-30 minutes for the transaction to be indexed.'
      };
    }

    const record = queryResultSet.records[0];
    
    const timestamp = record['last_transfer_timestamp'];
    const bridgeDate = timestamp && typeof timestamp === 'string' 
      ? new Date(timestamp).getTime() 
      : 0;

    const amount = Number(record['eth_amount']);
    const ethPrice = Number(record['avg_eth_price']);
    const usdValue = Number(record['estimated_usd_value']);

    if (usdValue >= 490) {
      return {
        amount,
        bridge_date: bridgeDate,
        ethPrice,
        usdValue,
        status: 'complete',
        message: 'Bridge requirement met! ✅'
      };
    }

    if (usdValue > 0) {
      const remaining = 500 - usdValue;
      return {
        amount,
        bridge_date: bridgeDate,
        ethPrice,
        usdValue,
        status: 'partial',
        message: `You've bridged $${usdValue.toFixed(2)}. Bridge an additional $${remaining.toFixed(2)} to meet the requirement.`
      };
    }

    return {
      amount: 0,
      bridge_date: 0,
      ethPrice: 0,
      usdValue: 0,
      status: 'none',
      message: 'No bridge transactions found. Bridge at least $500 to continue.'
    };

  } catch (error) {
    console.error('Bridge check error:', error);
    return {
      amount: 0,
      bridge_date: 0,
      ethPrice: 0,
      usdValue: 0,
      status: 'pending',
      message: 'Unable to check bridge balance.'
    };
  }
}

export async function checkLaikaBalance(userId: string) {
  const laikaPubKey = new PublicKey(process.env.NEXT_PUBLIC_LAIKA_ADDRESS!);
  const walletPubKey = new PublicKey(userId);
  const associatedTokenAccount = getAssociatedTokenAddressSync(laikaPubKey, walletPubKey);

  let accountExists = false;
  let tokenAccountInfo = null;

  try {
    const result = await connection.getParsedTokenAccountsByOwner(walletPubKey, {
      mint: laikaPubKey
    });
    const filteredAccount = result.value.filter(x => x.account.data.parsed.info.tokenAmount.uiAmount > 0);
    if (result.value.length > 0 && filteredAccount) {
      accountExists = true;
      tokenAccountInfo = filteredAccount[0];
    }
  }
  catch(err: unknown) {
    console.log('no laika account error', err);
  }

  return {
    accountExists,
    accountInfo: {
      address: associatedTokenAccount.toBase58(),
      balance: tokenAccountInfo ? tokenAccountInfo.account.data.parsed.info.tokenAmount.uiAmount : 0,
    }
  }



}