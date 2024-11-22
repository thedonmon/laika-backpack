import { createClient } from '@supabase/supabase-js'

import dotenv from 'dotenv';
dotenv.config();

export interface UserRecord {
  id?: bigint;
  created_at?: string;
  wallet: string;
  laika_token_account?: string;
  last_known_laika_balance?: number;
  signature: string;
  datetimestamp: number;
  message: string;
  bridge_balance?: number;
  bridged?: boolean;
  birdge_date?: number;
  last_checked?: number;
  usd_value?: number;
  eth_price?: number;
  met_bridge_req?: boolean;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function upsertUser(userData: UserRecord) {
    'use server' // This marks the function as server-side only
    
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert(
          {
            wallet: userData.wallet,
            signature: userData.signature,
            datetimestamp: userData.datetimestamp,
            message: userData.message,
            // Only update these if they exist
            ...(userData.laika_token_account && { laika_token_account: userData.laika_token_account }),
            ...(userData.last_known_laika_balance && { last_known_laika_balance: userData.last_known_laika_balance }),
            ...(userData.bridge_balance && { bridge_balance: userData.bridge_balance }),
            ...(userData.bridged !== undefined && { bridged: userData.bridged }),
            last_checked: Date.now()
          },
          {
            onConflict: 'wallet',
            ignoreDuplicates: false
          }
        )
        .select()
  
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error upserting user:', error)
      throw error
    }
  }
  
  export async function getUserByWallet(wallet: string) {
    'use server'
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet', wallet)
        .single()
  
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting user:', error)
      throw error
    }
  }
  
  interface BridgeResult {
    amount: number;
    bridge_date: number;
    ethPrice: number;
    usdValue: number;
    status: 'none' | 'pending' | 'partial' | 'complete';
    message: string;
  }

  export async function updateUserVerification(
    wallet: string, 
    bridgeResult?: BridgeResult,
    laikaBalance?: {
      accountExists: boolean,
      accountInfo: {
        address: string,
        balance: number,
      }
    }
  ) {
    'use server'
    
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          last_checked: Date.now(),
          // Only update bridge-related fields if we have a result
          ...(bridgeResult && {
            bridge_balance: bridgeResult.amount,
            bridge_date: bridgeResult.bridge_date,
            eth_price: bridgeResult.ethPrice,
            usd_value: bridgeResult.usdValue,
            bridged: bridgeResult.status === 'partial' || bridgeResult.status === 'complete',
            met_bridge_req: bridgeResult.status === 'complete'
          }),
          // Laika fields remain the same
          ...(laikaBalance !== undefined && { 
            last_known_laika_balance: laikaBalance.accountInfo.balance,
            laika_token_account: laikaBalance.accountInfo.address 
          }),
        })
        .eq('wallet', wallet)
        .select()
  
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating user verification:', error)
      throw error
    }
  }