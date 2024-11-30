import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ 
    error: 'Campaign has ended',
    message: 'The verification period for this campaign has ended. All qualifying transactions will be counted in the final tally.'
  }, { 
    status: 403 
  });
}