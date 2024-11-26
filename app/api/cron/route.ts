import { updateBridgeData } from "@/app/actions/snapsot";
import { headers } from "next/headers";
import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function GET() {
  console.log('🟢 Cron triggered:', new Date().toISOString());
  const userAgent = headers().get('user-agent') || '';
  if (userAgent.includes('Node.js') || userAgent.includes('Next.js')) {
    console.log('⏭️ Skipping cron during build');
    return NextResponse.json({ skipped: true, reason: 'build-time' });
  }

  try {
    // Create a promise that will resolve when updateBridgeData is truly complete
    const result = await new Promise(async (resolve, reject) => {
      try {
        // Track if the function has completed
        let isComplete = false;
        
        // Set a timeout to ensure we don't exceed Vercel's limit
        const timeout = setTimeout(() => {
          if (!isComplete) {
            reject(new Error('Function timed out after 59s'));
          }
        }, 59000);
        
        // Run the update
        const lastSignature = await updateBridgeData();
        
        // Mark as complete and clean up
        isComplete = true;
        clearTimeout(timeout);
        resolve(lastSignature);
      } catch (error) {
        reject(error);
      }
    });

    console.log('✅ Cron completed successfully:', result);
    
    return NextResponse.json({ 
      success: true, 
      lastSignature: result,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('❌ Cron failed:', error);
    
    return NextResponse.json({ 
      error: 'Failed to update bridge data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}