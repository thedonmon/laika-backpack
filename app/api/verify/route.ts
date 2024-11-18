import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { PublicKey } from '@solana/web3.js'
import { Connection } from '@solana/web3.js'
import nacl from 'tweetnacl'
import bs58 from 'bs58'

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET_KEY!)
const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com')

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('verification_token')
    const body = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token missing' },
        { status: 401 }
      )
    }

    const { payload } = await jwtVerify(token.value, SECRET_KEY)
    
    // Verify signature
    const publicKey = new PublicKey(body.userId)
    const message = Buffer.from(body.message, 'base64')
    const signature = bs58.decode(body.signature)

    const isValid = nacl.sign.detached.verify(
      message,
      signature,
      publicKey.toBytes()
    )

    if (!isValid || payload.userId !== body.userId) {
      return NextResponse.json(
        { error: 'Invalid verification' },
        { status: 401 }
      )
    }

    // TODO: Add balance checks here
    // Bridge check
    // const balance = await connection.getBalance(publicKey)
    // const tokenBalance = await connection.getTokenAccountBalance(...)
    
    // TODO: Store verification in database
    // await db.verifications.create({
    //   publicKey: publicKey.toString(),
    //   timestamp: Date.now(),
    //   balances: {...}
    // })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed', details: error },
      { status: 401 }
    )
  }
} 