"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { ClassGrid } from "./class-grid";
import { CampusMap } from "./campus-map";
import { FiltersModal } from "./filters-modal";
import { SeriesWithDetails } from "@/lib/actions";

export type Filters = {
  timeOfDay: string[];
  matsProvided: boolean | null;
};

type ClassLocation = {
  building: string;
  address: string;
  seriesIds: number[];
};

interface ExploreContentProps {
  series: SeriesWithDetails[];
  classLocations: ClassLocation[];
}

export function ExploreContent({ series, classLocations }: ExploreContentProps) {
  const [hoveredSeriesIds, setHoveredSeriesIds] = useState<number[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleLocationAddresses, setVisibleLocationAddresses] = useState<string[]>([]);
  const [dismissTooltipTrigger, setDismissTooltipTrigger] = useState(0);

  const [filters, setFilters] = useState<Filters>({
    timeOfDay: [],
    matsProvided: null,
  });

  // Apply filters to series
  const filteredSeries = series.filter(s => {
    // Time of day filter
    if (filters.timeOfDay.length > 0) {
      const hour = parseInt(s.startTime.split(':')[0]);
      const timeMatches = filters.timeOfDay.some(time => {
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
    if (filters.matsProvided !== null) {
      if (s.matsProvided !== filters.matsProvided) return false;
    }

    // Only show series if at least one of their locations is visible on the map
    if (visibleLocationAddresses.length > 0) {
      // Find all locations for this series
      const seriesLocations = classLocations.filter(loc => loc.seriesIds.includes(s.id));
      // Check if at least one location is visible
      const hasVisibleLocation = seriesLocations.some(loc => visibleLocationAddresses.includes(loc.address));
      if (!hasVisibleLocation) return false;
    }

    return true;
  });

  // Filter class locations to only show pins for filtered series
  const filteredSeriesIds = new Set(filteredSeries.map(s => s.id));
  const filteredClassLocations = classLocations
    .map(location => ({
      ...location,
      seriesIds: location.seriesIds.filter(id => filteredSeriesIds.has(id))
    }))
    .filter(location => location.seriesIds.length > 0);

  const handleFiltersClick = () => {
    setDismissTooltipTrigger(prev => prev + 1); // Dismiss any open tooltip
    setFiltersOpen(true);
  };

  const handleSeriesHover = (id: number | null) => {
    if (id !== null) {
      setDismissTooltipTrigger(prev => prev + 1); // Dismiss tooltip when hovering a card
    }
    setHoveredSeriesIds(id ? [id] : []);
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="ml-1">
          <h1 className="mb-2 text-3xl font-bold md:text-4xl bg-gradient-to-r from-[#644874] to-[#6B92B5] bg-clip-text text-transparent">
            Explore Classes
          </h1>
        </div>
        <Button
          onClick={handleFiltersClick}
          variant="outline"
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_550px] gap-6">
        <div className="h-[calc(100vh-200px)]">
          <ClassGrid
            series={filteredSeries}
            hoveredSeriesIds={hoveredSeriesIds}
            onSeriesHover={handleSeriesHover}
          />
        </div>
        <div className="hidden lg:block h-[calc(100vh-200px)]">
          <CampusMap
            series={filteredSeries}
            classLocations={filteredClassLocations}
            allClassLocations={classLocations}
            hoveredSeriesIds={hoveredSeriesIds}
            onPinHover={(ids) => setHoveredSeriesIds(ids)}
            onVisibleLocationsChange={setVisibleLocationAddresses}
            dismissTooltipTrigger={dismissTooltipTrigger}
          />
        </div>
      </div>

      <FiltersModal
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onFiltersChange={setFilters}
        series={series}
      />
    </>
  );
}
