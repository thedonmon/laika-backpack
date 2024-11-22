import { backfillBridgeData } from "@/app/actions/snapsot";


console.log('Starting backfill...');
backfillBridgeData()
  .then(() => {
    console.log('Backfill complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  }); 