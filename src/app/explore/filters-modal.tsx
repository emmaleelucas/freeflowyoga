"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Filters } from "./explore-content";
import { SeriesWithDetails } from "@/lib/actions";

interface FiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  series: SeriesWithDetails[];
}

export function FiltersModal({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  series,
}: FiltersModalProps) {
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  // Sync local filters with parent filters when modal opens
  useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  // Calculate result count based on local filters
  const resultCount = series.filter(s => {
    // Time of day filter
    if (localFilters.timeOfDay.length > 0) {
      const hour = parseInt(s.startTime.split(':')[0]);
      const timeMatches = localFilters.timeOfDay.some(time => {
        // Morning: 6am - 11am (6:00 - 10:59)
        if (time === 'morning' && hour >= 6 && hour < 11) return true;
        // Midday: 11am - 1pm (11:00 - 12:59)
        if (time === 'midday' && hour >= 11 && hour < 13) return true;
        // Afternoon: 1pm - 5pm (13:00 - 16:59)
        if (time === 'afternoon' && hour >= 13 && hour < 17) return true;
        // Evening: 5pm - 9pm (17:00 - 20:59)
        if (time === 'evening' && hour >= 17 && hour < 21) return true;
        return false;
      });
      if (!timeMatches) return false;
    }

    // Mats provided filter
    if (localFilters.matsProvided !== null) {
      if (s.matsProvided !== localFilters.matsProvided) return false;
    }

    return true;
  }).length;

  const handleApply = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      // Reset filters to show all classes when closing without applying
      const resetFilters: Filters = {
        timeOfDay: [],
        matsProvided: null,
      };
      onFiltersChange(resetFilters);
    }
    onOpenChange(open);
  };

  const handleReset = () => {
    const resetFilters: Filters = {
      timeOfDay: [],
      matsProvided: null,
    };
    setLocalFilters(resetFilters);
  };

  const toggleTimeOfDay = (time: string) => {
    const newTimeOfDay = localFilters.timeOfDay.includes(time)
      ? localFilters.timeOfDay.filter(t => t !== time)
      : [...localFilters.timeOfDay, time];
    setLocalFilters({ ...localFilters, timeOfDay: newTimeOfDay });
  };

  const setMatsProvided = (value: boolean | null) => {
    setLocalFilters({ ...localFilters, matsProvided: value });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0">
        <div className="px-6 pt-6">
          <DialogHeader>
            <DialogTitle>Filter Classes</DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Time of Day */}
          <div>
            <h3 className="text-base font-semibold mb-3">Time of Day</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleTimeOfDay('morning')}
                className={localFilters.timeOfDay.includes('morning')
                  ? "bg-[#644874] text-white border-[#644874]"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              >
                Morning (6 - 11 AM)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleTimeOfDay('midday')}
                className={localFilters.timeOfDay.includes('midday')
                  ? "bg-[#644874] text-white border-[#644874]"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              >
                Midday (11 AM - 1 PM)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleTimeOfDay('afternoon')}
                className={localFilters.timeOfDay.includes('afternoon')
                  ? "bg-[#644874] text-white border-[#644874]"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              >
                Afternoon (1 - 5 PM)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleTimeOfDay('evening')}
                className={localFilters.timeOfDay.includes('evening')
                  ? "bg-[#644874] text-white border-[#644874]"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              >
                Evening (5 - 9 PM)
              </Button>
            </div>
          </div>

          <Separator />

          {/* Mats Provided */}
          <div>
            <h3 className="text-base font-semibold mb-3">Mats</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMatsProvided(null)}
                className={localFilters.matsProvided === null
                  ? "bg-[#644874] text-white border-[#644874]"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              >
                Any
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMatsProvided(true)}
                className={localFilters.matsProvided === true
                  ? "bg-[#644874] text-white border-[#644874]"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              >
                Mats Provided
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMatsProvided(false)}
                className={localFilters.matsProvided === false
                  ? "bg-[#644874] text-white border-[#644874]"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              >
                Bring Your Own
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t bg-white dark:bg-gray-950 px-6 py-4 flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            Reset
          </Button>
          <Button
            onClick={handleApply}
            disabled={resultCount === 0}
            className="flex-1 bg-[#644874] hover:bg-[#553965]"
          >
            {resultCount === 0 ? 'No exact matches' : `Show ${resultCount} result${resultCount === 1 ? '' : 's'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
