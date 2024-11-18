'use server'

import { SignJWT } from 'jose'
import { cookies } from 'next/headers'

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET_KEY!)

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