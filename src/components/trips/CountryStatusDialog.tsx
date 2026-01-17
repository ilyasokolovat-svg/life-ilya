import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Home, Plane, Trash2, Loader2 } from 'lucide-react';
import { CountryVisitData, LivedInPeriod } from '@/hooks/useVisitedCountries';
import LivedInDialog from './LivedInDialog';

interface CountryStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  countryName: string;
  countryCode: string;
  countryData: CountryVisitData | undefined;
  existingPeriods: LivedInPeriod[];
  onSaveLivedIn: (periods: LivedInPeriod[]) => Promise<void>;
  onRemoveLivedIn: () => Promise<void>;
  onAddVisited: () => Promise<void>;
  onRemoveVisited: () => Promise<void>;
  isRemoving: boolean;
  isAddingVisited: boolean;
  isRemovingVisited: boolean;
}

const CountryStatusDialog: React.FC<CountryStatusDialogProps> = ({
  open,
  onOpenChange,
  countryName,
  countryCode,
  countryData,
  existingPeriods,
  onSaveLivedIn,
  onRemoveLivedIn,
  onAddVisited,
  onRemoveVisited,
  isRemoving,
  isAddingVisited,
  isRemovingVisited,
}) => {
  const [showLivedInDialog, setShowLivedInDialog] = useState(false);
  const [isAddingVisit, setIsAddingVisit] = useState(false);
  const [isRemovingVisit, setIsRemovingVisit] = useState(false);

  const isLivedIn = countryData?.isLivedIn || existingPeriods.length > 0;
  const isVisited = countryData && countryData.visitCount > 0;
  const isManualVisited = countryData?.isManualOnly && !isLivedIn;

  const handleLivedClick = () => {
    setShowLivedInDialog(true);
  };

  const handleVisitedClick = async () => {
    setIsAddingVisit(true);
    try {
      await onAddVisited();
      onOpenChange(false);
    } finally {
      setIsAddingVisit(false);
    }
  };

  const handleRemoveVisitedClick = async () => {
    setIsRemovingVisit(true);
    try {
      await onRemoveVisited();
      onOpenChange(false);
    } finally {
      setIsRemovingVisit(false);
    }
  };

  const handleLivedInSave = async (periods: LivedInPeriod[]) => {
    await onSaveLivedIn(periods);
    setShowLivedInDialog(false);
    onOpenChange(false);
  };

  const handleLivedInRemove = async () => {
    await onRemoveLivedIn();
    setShowLivedInDialog(false);
    onOpenChange(false);
  };

  if (showLivedInDialog) {
    return (
      <LivedInDialog
        open={true}
        onOpenChange={(open) => {
          if (!open) {
            setShowLivedInDialog(false);
          }
        }}
        countryName={countryName}
        countryCode={countryCode}
        existingPeriods={existingPeriods}
        onSave={handleLivedInSave}
        onRemove={handleLivedInRemove}
        isRemoving={isRemoving}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">{countryName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          <p className="text-sm text-center text-muted-foreground">
            How do you want to mark this country?
          </p>

          {/* Status indicators */}
          <div className="flex justify-center gap-2 text-xs">
            {isLivedIn && (
              <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">
                <Home className="h-3 w-3" />
                Lived here
              </span>
            )}
            {isVisited && (
              <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded-full flex items-center gap-1">
                <Plane className="h-3 w-3" />
                {countryData.visitCount} visit{countryData.visitCount !== 1 ? 's' : ''}
              </span>
            )}
            {isManualVisited && (
              <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded-full flex items-center gap-1">
                <Plane className="h-3 w-3" />
                Visited
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleLivedClick}
              className="h-24 flex flex-col items-center justify-center gap-2 border-amber-200 hover:bg-amber-50 hover:border-amber-400"
            >
              <Home className="h-8 w-8 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">
                {isLivedIn ? 'Edit Lived' : 'Lived Here'}
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={isManualVisited ? handleRemoveVisitedClick : handleVisitedClick}
              disabled={isAddingVisit || isAddingVisited || isVisited || isRemovingVisit || isRemovingVisited}
              className={`h-24 flex flex-col items-center justify-center gap-2 ${
                isManualVisited 
                  ? 'border-red-200 hover:bg-red-50 hover:border-red-400' 
                  : 'border-teal-200 hover:bg-teal-50 hover:border-teal-400'
              } disabled:opacity-50`}
            >
              {isRemovingVisit || isRemovingVisited ? (
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
              ) : isManualVisited ? (
                <Trash2 className="h-8 w-8 text-red-500" />
              ) : (
                <Plane className={`h-8 w-8 ${isVisited ? 'text-gray-400' : 'text-teal-600'}`} />
              )}
              <span className={`text-sm font-medium ${
                isManualVisited ? 'text-red-600' : isVisited ? 'text-gray-400' : 'text-teal-700'
              }`}>
                {isManualVisited 
                  ? 'Remove Visited' 
                  : isVisited 
                    ? 'Has Trip Data' 
                    : 'Mark Visited'}
              </span>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-2">
            {isVisited 
              ? 'Trips are automatically tracked from your past journeys'
              : isManualVisited
                ? 'This was manually marked as visited'
                : 'Add a past trip to automatically track visits'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CountryStatusDialog;
