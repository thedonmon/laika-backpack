import { NextResponse } from 'next/server'
import { getUserByWallet } from '@/app/actions/database'
// import { checkBridgeBalance, checkLaikaBalance } from '@/app/actions/verification';

export async function GET(
  request: Request,
  { params }: { params: { wallet: string } }
) {
  try {
    const userData = await getUserByWallet(params.wallet);
    if (!userData) {
      return NextResponse.json({
        user: null,
        verification: {
          userExists: false,
          hasBackpack: false,
          isVerified: false,
          bridge: {
            status: 'none',
            message: 'No bridge transactions found. Bridge at least $500 to continue.',
            usdValue: 0,
            lastBridgeDate: 0,
            ethAmount: 0,
            ethPrice: 0
          },
          laika: {
            hasAccount: false,
            balance: 0,
          }
        }
      });
    }

    let bridgeStatus: 'none' | 'pending' | 'partial' | 'complete' = 'none';
    let bridgeMessage = 'No bridge transactions found. Bridge at least $500 to continue.';
    
    if (userData.bridged) {
      if (userData.met_bridge_req) {
        bridgeStatus = 'complete';
        bridgeMessage = 'Bridge requirement met! ✅';
      } else {
        bridgeStatus = 'partial';
        const remaining = 500 - (userData.usd_value || 0);
        bridgeMessage = `You've bridged $${userData.usd_value?.toFixed(2)}. Bridge an additional $${remaining.toFixed(2)} to meet the requirement.`;
      }
    }

    return NextResponse.json({
      user: userData,
      verification: {
        userExists: true,
        hasBackpack: true,
        isVerified: !!userData.signature,
        bridge: {
          status: bridgeStatus,
          message: bridgeMessage,
          usdValue: userData.usd_value || 0,
          lastBridgeDate: userData.bridge_date || 0,
          ethAmount: userData.bridge_balance || 0,
          ethPrice: userData.eth_price || 0
        },
        laika: {
          hasAccount: !!userData.laika_token_account,
          balance: userData.last_known_laika_balance || 0,
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({
      user: null,
      verification: {
        userExists: false,
        hasBackpack: false,
        isVerified: false,
        bridge: {
          status: 'none',
          message: 'No bridge transactions found. Bridge at least $500 to continue.',
          usdValue: 0,
          lastBridgeDate: 0,
          ethAmount: 0,
          ethPrice: 0
        },
        laika: {
          hasAccount: false,
          balance: 0,
        }
      }
    });
  }
} 

// async function testBridgeCheck(walletId: string) {
//   const testWallet = walletId;
  
//   try {
//     console.log("Testing bridge check for wallet:", testWallet);
    
//     // Call the original query function
//     const bridgeResult = await checkBridgeBalance(testWallet);
//     console.log("Bridge check result:", JSON.stringify(bridgeResult, null, 2));
    
//     // If using Flipside, you can also test the query directly
//     const laikaResult = await checkLaikaBalance(testWallet);
//     console.log("Laika result:", JSON.stringify(laikaResult, null, 2));
    
//   } catch (error) {
//     console.error("Test failed:", error);
//   }
// }