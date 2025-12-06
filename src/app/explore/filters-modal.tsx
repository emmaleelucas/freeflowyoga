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
        if (time === 'morning' && hour >= 6 && hour < 12) return true;
        if (time === 'midday' && hour >= 12 && hour < 15) return true;
        if (time === 'afternoon' && hour >= 15 && hour < 18) return true;
        if (time === 'evening' && hour >= 18) return true;
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
        classType: [],
        level: "alllevels",
        matsProvided: null,
      };
      onFiltersChange(resetFilters);
    }
    onOpenChange(open);
  };

  const handleReset = () => {
    const resetFilters: Filters = {
      timeOfDay: [],
      classType: [],
      level: "alllevels",
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

  const toggleClassType = (type: string) => {
    const newClassType = localFilters.classType.includes(type)
      ? localFilters.classType.filter(t => t !== type)
      : [...localFilters.classType, type];
    setLocalFilters({ ...localFilters, classType: newClassType });
  };

  const setLevel = (level: string) => {
    setLocalFilters({ ...localFilters, level });
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
                Morning (6 AM - 12 PM)
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
                Midday (12 PM - 3 PM)
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
                Afternoon (3 PM - 6 PM)
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
                Evening (6 PM onwards)
              </Button>
            </div>
          </div>

          <Separator />

          {/* Class Type */}
          <div>
            <h3 className="text-base font-semibold mb-3">Class Type</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleClassType('flow')}
                className={localFilters.classType.includes('flow')
                  ? "bg-[#644874] text-white border-[#644874]"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              >
                Flow
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleClassType('restorative')}
                className={localFilters.classType.includes('restorative')
                  ? "bg-[#644874] text-white border-[#644874]"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              >
                Restorative
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleClassType('gentle')}
                className={localFilters.classType.includes('gentle')
                  ? "bg-[#644874] text-white border-[#644874]"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              >
                Gentle
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleClassType('sculpt')}
                className={localFilters.classType.includes('sculpt')
                  ? "bg-[#644874] text-white border-[#644874]"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              >
                Sculpt
              </Button>
            </div>
          </div>

          <Separator />

          {/* Level */}
          <div>
            <h3 className="text-base font-semibold mb-3">Level</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLevel('beginner')}
                className={localFilters.level === 'beginner'
                  ? "bg-[#644874] text-white border-[#644874]"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              >
                Beginner
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLevel('intermediate')}
                className={localFilters.level === 'intermediate'
                  ? "bg-[#644874] text-white border-[#644874]"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              >
                Intermediate/Advanced
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLevel('alllevels')}
                className={localFilters.level === 'alllevels'
                  ? "bg-[#644874] text-white border-[#644874]"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              >
                All Levels
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
