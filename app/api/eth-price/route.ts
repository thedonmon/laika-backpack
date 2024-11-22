import { NextResponse } from 'next/server';

export const revalidate = 10800; // 3 hours

export async function GET() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
    );
    const data = await response.json();
    return NextResponse.json({ price: data.ethereum.usd });
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    return NextResponse.json({ price: 0 }, { status: 500 });
  }
} 