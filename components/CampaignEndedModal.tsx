import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

export function CampaignEndedModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/90 border border-gray-800 text-white">
        <DialogClose className="absolute right-4 top-4 text-gray-400 hover:text-white" />
        <DialogHeader>
          <DialogTitle className="text-xl text-center">Campaign Ended</DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-4">
          <p>
            The First Landing campaign has ended. Thank you for your participation!
          </p>
          <p className="text-sm text-gray-400">
            {`If you verified before and weren't eligible because the bridge transaction was missed or not available, 
            it will be found and updated. Do not worry - all qualifying transactions will be counted in the final tally.`}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 