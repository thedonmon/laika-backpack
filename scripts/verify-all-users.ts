import { updateUserVerification } from '@/app/actions/database';
import { checkBridgeBalance, checkLaikaBalance } from '@/app/actions/verification';
import { createClient } from '@supabase/supabase-js';

import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyAllUsers() {
  console.log('Starting user verification...');
  
  // Get all users from the database
  const { data: users, error } = await supabase
    .from('users')
    .select('wallet');

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  console.log(`Found ${users.length} users to verify`);

  // Process each user
  const count = users.length;
  let index = 0;
  for (const user of users) {
    try {
      index++;
      console.log(`Verifying user ${index}/${count} ${user.wallet}...`);
      
      const bridgeBalance = await checkBridgeBalance(user.wallet);
      const laikaBalance = await checkLaikaBalance(user.wallet);

      await updateUserVerification(
        user.wallet,
        bridgeBalance,
        laikaBalance
      );

      console.log(`✅ Verified ${user.wallet}`);
    } catch (error) {
      console.error(`❌ Failed to verify ${user.wallet}:`, error);
      // Continue with next user even if one fails
      continue;
    }

    // Add a small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 500));
  }
}

console.log('Starting verification process...');
verifyAllUsers()
  .then(() => {
    console.log('Verification complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  }); 