'use client'

import { generateVerificationToken } from '../app/actions/verification'

export function VerificationButton({ userId }: { userId: string }) {
  const handleVerification = async () => {
    try {
      // First get a verification token from the server action
      await generateVerificationToken(userId)
      
      // Then make the verification request
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error('Verification failed')
      }

      // Handle successful verification
    } catch (error) {
      // Handle error
      console.error('Verification error:', error)
    }
  }

  return (
    <button onClick={handleVerification}>
      Verify
    </button>
  )
} 