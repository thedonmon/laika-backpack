import { NextResponse } from 'next/server'
import { upsertUser, getUserByWallet, updateUserVerification } from '@/app/actions/database'
import { checkBridgeBalance, checkLaikaBalance } from '@/app/actions/verification'
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, signature, message, timestamp } = body

    // First, create/update the user record
    await upsertUser({
      wallet: userId,
      signature,
      message,
      datetimestamp: timestamp
    })

    let userData = await getUserByWallet(userId)

    if (userData.met_bridge_req === true) {
      return NextResponse.json({
        verified: true,
        bridgeCompleted: userData.met_bridge_req || false,
        purchaseCompleted: (userData.last_known_laika_balance || 0) > 0,
        timestamp: Date.now()
      })
    }

    // Then check bridge and token balances (implement these functions based on your needs)
    const bridgeBalance = await checkBridgeBalance(userId)
    const laikaBalance = await checkLaikaBalance(userId)

    // Update the verification status
    await updateUserVerification(userId, bridgeBalance, laikaBalance)

    // Get the latest user data to return
    userData = await getUserByWallet(userId)

    return NextResponse.json({
      verified: true,
      bridgeCompleted: userData.met_bridge_req || false,
      purchaseCompleted: (userData.last_known_laika_balance || 0) > 0,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 400 }
    )
  }
}