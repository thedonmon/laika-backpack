import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET_KEY!)

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('verification_token')

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token missing' },
        { status: 401 }
      )
    }

    const { payload } = await jwtVerify(token.value, SECRET_KEY)
    
    const body = await request.json()
    if (payload.userId !== body.userId) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 401 }
      )
    }

    // Perform verification logic here
    // ...

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid verification token', details: error },
      { status: 401 }
    )
  }
} 