import { updateBridgeData } from "@/app/actions/snapsot";


console.log('Starting backfill...');
updateBridgeData()
  .then(() => {
    console.log('Backfill complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  }); 