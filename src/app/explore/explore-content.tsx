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
  classType: string[];
  level: string;
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

  const [filters, setFilters] = useState<Filters>({
    timeOfDay: [],
    classType: [],
    level: "alllevels",
    matsProvided: null,
  });

  // Apply filters to series
  const filteredSeries = series.filter(s => {
    // Time of day filter
    if (filters.timeOfDay.length > 0) {
      const hour = parseInt(s.startTime.split(':')[0]);
      const timeMatches = filters.timeOfDay.some(time => {
        if (time === 'morning' && hour >= 6 && hour < 12) return true;
        if (time === 'midday' && hour >= 12 && hour < 15) return true;
        if (time === 'afternoon' && hour >= 15 && hour < 18) return true;
        if (time === 'evening' && hour >= 18) return true;
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

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="ml-1">
          <h1 className="mb-2 text-3xl font-bold md:text-4xl bg-gradient-to-r from-[#644874] to-[#6B92B5] bg-clip-text text-transparent">
            Explore Classes
          </h1>
        </div>
        <Button
          onClick={() => setFiltersOpen(true)}
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
            onSeriesHover={(id) => setHoveredSeriesIds(id ? [id] : [])}
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
