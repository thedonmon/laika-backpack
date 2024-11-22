/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey } from "@solana/web3.js";
import PQueue from "p-queue";
import dotenv from 'dotenv';
dotenv.config();

const EARLIEST_DATE = new Date('2024-11-19T23:59:00Z');

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const connection = new Connection("https://eclipse.lgns.net");
const ethBridgeAddress = new PublicKey("br1xwubggTiEZ6b7iNZUwfA3psygFfaXGfZ1heaN9AW");

// Shared helper functions
async function getLatestSignature() {
  const { data, error } = await supabase
    .from('bridge_transactions')
    .select('signature')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching latest signature:', error);
    return undefined;
  }

  return data?.[0]?.signature;
}

async function processTransaction(confirmedSignatureInfo: any, bridgeWallets: Map<string, any>) {
  const txn = await connection.getParsedTransaction(confirmedSignatureInfo.signature);
  if (!txn || txn.transaction.message.accountKeys.length <= 2) return;

  // Check if the first instruction is CreateAccount
  const firstInstruction = txn.transaction.message.instructions[0];
  const bridgeWalletIndex = ('parsed' in firstInstruction && 
    firstInstruction.program === "system" && 
    firstInstruction.parsed?.type === "createAccount") ? 2 : 1;

  const bridgeWallet = txn.transaction.message.accountKeys[bridgeWalletIndex].pubkey.toBase58();
  const txnDate = new Date(confirmedSignatureInfo.blockTime! * 1000);

  let bridgedAmountInLamports = 0;
  
  if (!txn.meta?.innerInstructions) {
    txn.transaction.message.instructions.forEach((instruction) => {
      if ('parsed' in instruction && 
          instruction.program === "system" && 
          instruction.parsed?.type === "transfer") {
        bridgedAmountInLamports += Number(instruction.parsed.info.lamports);
      }
    });
  } else {
    txn.meta.innerInstructions.forEach((innerInstruction) => {
      innerInstruction.instructions.forEach((instruction) => {
        if ('parsed' in instruction && 
            instruction.program === "system" && 
            instruction.parsed?.type === "transfer") {
          bridgedAmountInLamports += Number(instruction.parsed.info.lamports);
        }
      });
    });
  }

  if (!bridgedAmountInLamports) {
    console.log(`Skipping transaction ${confirmedSignatureInfo.signature} - no bridge amount found`);
    return;
  }

  // Update bridgeWallets map
  if (!bridgeWallets.has(bridgeWallet)) {
    bridgeWallets.set(bridgeWallet, {
      earliestDate: txnDate,
      txnCount: 1,
      bridgedAmountInLamports,
    });
  } else {
    const walletInfo = bridgeWallets.get(bridgeWallet)!;
    if (txnDate < walletInfo.earliestDate) {
      walletInfo.earliestDate = txnDate;
    }
    walletInfo.txnCount++;
    walletInfo.bridgedAmountInLamports += bridgedAmountInLamports;
  }

  // Insert into Supabase
  const { error } = await supabase
    .from('bridge_transactions')
    .upsert({
      signature: confirmedSignatureInfo.signature,
      bridge_wallet: bridgeWallet,
      created_at: txnDate.toISOString(),
      bridged_amount_lamports: bridgedAmountInLamports
    }, {
      onConflict: 'signature'  // signature should be your unique constraint column
    });

  if (error) {
    console.error('Error upserting transaction:', error);
  }

  console.log(`Processed: ${confirmedSignatureInfo.signature} Bridge Wallet: ${bridgeWallet}`);
}

// Function 1: Initial backfill to Nov 19 2024
export async function backfillBridgeData() {
  console.log("Starting initial backfill to Nov 19 2024...");
  const workerQueue = new PQueue({ concurrency: 3 });
  const bridgeWallets = new Map();

  for await (const signatures of getAllSignaturesForAddress(ethBridgeAddress, 1000)) {
    for (const sig of signatures) {
      workerQueue.add(async () => {
        await processTransaction(sig, bridgeWallets);
        await new Promise((r) => setTimeout(r, 350));
      });
    }
  }

  await workerQueue.onIdle();
}

// Function 2: Cron job to update since last signature
export async function updateBridgeData() {
  console.log("Starting incremental update...");
  const workerQueue = new PQueue({ concurrency: 3 });
  const bridgeWallets = new Map();
  
  // Get the most recent signature from our database
  const { data: lastProcessedTx } = await supabase
    .from('bridge_transactions')
    .select('signature')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Use the last processed signature as our starting point
  const lastSignature = lastProcessedTx?.signature || await getLatestSignature();
  console.log("Starting from signature:", lastSignature);

  for await (const signatures of getAllSignaturesForAddress(ethBridgeAddress, 1000, undefined, lastSignature)) {
    for (const sig of signatures) {
      // Skip the last processed signature itself
      if (sig.signature === lastProcessedTx?.signature) continue;
      
      workerQueue.add(async () => {
        try {
          await processTransaction(sig, bridgeWallets);
          await new Promise((r) => setTimeout(r, 350));
        } catch (error: any) {
          // Only log non-duplicate errors
          if (error?.code !== '23505') {
            console.error('Error processing transaction:', error);
          }
        }
      });
    }
  }

  await workerQueue.onIdle();
  console.log("Incremental update completed");
}

export async function* getAllSignaturesForAddress(
  address: PublicKey,
  limit = 1000,
  before: string | undefined = undefined,
  until: string | undefined = undefined,
) {
  let lastSignature = before;

  while (true) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: any = {
      limit,
      before: lastSignature,
      until: until
    };
    const signatures = await connection.getSignaturesForAddress(
      address,
      options
    );
    if (signatures.length === 0) {
      break;
    }

    // Add date check
    const oldestTxnInBatch = new Date(signatures[signatures.length - 1].blockTime! * 1000);
    if (oldestTxnInBatch < EARLIEST_DATE) {
      console.log("Reached November 19th 2024, stopping...");
      // Still yield the signatures that are after our cutoff date
      const validSignatures = signatures.filter(
        sig => new Date(sig.blockTime! * 1000) >= EARLIEST_DATE
      );
      if (validSignatures.length > 0) {
        yield validSignatures;
      }
      break;
    }

    lastSignature = signatures[signatures.length - 1].signature;
    yield signatures;

    if (signatures.length < limit) {
      console.log("Exhausted...");
      break;
    }
  }
}

