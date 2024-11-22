/* eslint-disable @typescript-eslint/ban-ts-comment */
'use server'

import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { createClient } from '@supabase/supabase-js'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

async function getEthPrice(): Promise<number> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/eth-price`, {
      next: { revalidate: 10800 }
    });
    const data = await response.json();
    return data.price;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    return 0;
  }
}

export async function checkBridgeBalance(userId: string): Promise<BridgeResult> {
  const ethPrice = await getEthPrice();
  
  try {
    // Query bridge_transactions with aggregations
    const { data: bridgeData, error } = await supabase
      .rpc('get_bridge_stats', { wallet_address: userId })
      .single();

    if (error) {
      console.error('Error querying bridge_transactions:', error);
      return {
        amount: 0,
        bridge_date: 0,
        ethPrice,
        usdValue: 0,
        status: 'pending',
        message: 'If you recently bridged, please note it may take a few minutes for the transaction to be indexed.'
      };
    }

    //@ts-expect-error
    if (!bridgeData?.total_bridged_amount) {
      return {
        amount: 0,
        bridge_date: 0,
        ethPrice,
        usdValue: 0,
        status: 'pending',
        message: 'If you recently bridged, please note it may take a few minutes for the transaction to be indexed.'
      };
    }

    //@ts-expect-error
    const bridgeDate = bridgeData.earliest_date 
    //@ts-expect-error
      ? new Date(bridgeData.earliest_date).getTime()
      : 0;
    
    // Convert lamports to ETH
    //@ts-expect-error
    const ethAmount = Number(bridgeData.total_bridged_amount) / LAMPORTS_PER_SOL;
    const usdValue = ethAmount * ethPrice;

    console.log('Processed values:', {
      ethAmount,
      ethPrice,
      usdValue,
      bridgeDate,
      //@ts-expect-error
      transactionCount: bridgeData.count
    });

    if (usdValue >= 490) {
      return {
        amount: ethAmount,
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
        amount: ethAmount,
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
      ethPrice,
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