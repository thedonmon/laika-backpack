import { updateBridgeData } from "@/app/actions/snapsot";
import { NextResponse } from 'next/server';
export const maxDuration = 60;

export async function GET() {
  try {
    console.time('Starting snapshot');
    await updateBridgeData();
    console.timeEnd('Starting snapshot');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ error: 'Failed to update bridge data' }, { status: 500 });
  }
}