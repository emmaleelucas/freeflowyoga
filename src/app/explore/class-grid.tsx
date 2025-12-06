"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, Users, ChevronRight } from "lucide-react";
import { SeriesWithDetails } from "@/lib/actions";
import { useState } from "react";
import { SeriesDetailsDialog } from "./series-details-dialog";

interface ClassGridProps {
  series: SeriesWithDetails[];
  hoveredSeriesIds: number[];
  onSeriesHover: (id: number | null) => void;
}

export function ClassGrid({ series, hoveredSeriesIds, onSeriesHover }: ClassGridProps) {
  const [selectedSeries, setSelectedSeries] = useState<SeriesWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getDayNames = (recurrenceDays: number[]) => {
    const dayNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
    return [...recurrenceDays].sort((a, b) => a - b).map(d => dayNames[d]);
  };

  if (series.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-[#644874]/10 dark:bg-[#644874]/20 p-4 mb-4">
          <Calendar className="h-8 w-8 text-[#644874] dark:text-[#9d7fb0]" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No Classes Found</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Try adjusting your filters to see more classes.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-y-auto p-1">
      {series.map((s) => (
        <Card
          key={s.id}
          className={`cursor-pointer transition-all duration-200 ${
            hoveredSeriesIds.includes(s.id)
              ? 'ring-2 ring-[#644874] shadow-lg'
              : 'hover:shadow-md hover:border-[#644874]/40'
          } ${series.length === 1 ? 'md:col-span-2 h-fit' : ''}`}
          onMouseEnter={() => onSeriesHover(s.id)}
          onMouseLeave={() => onSeriesHover(null)}
          onClick={() => {
            setSelectedSeries(s);
            setDialogOpen(true);
          }}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2 mb-3">
              <CardTitle className="text-lg">{s.seriesName}</CardTitle>
              <Badge
                variant={s.matsProvided ? "secondary" : "outline"}
                className={s.matsProvided
                  ? "bg-[#644874]/10 text-[#644874] dark:bg-[#644874]/20 dark:text-[#9d7fb0] whitespace-nowrap hover:bg-[#644874]/10 dark:hover:bg-[#644874]/20"
                  : "border-[#644874] text-[#644874] whitespace-nowrap hover:bg-transparent"
                }
              >
                {s.matsProvided ? "Mats ✓" : "BYO Mat"}
              </Badge>
            </div>

            <div className="space-y-2.5 text-sm">
              {/* Days as badges */}
              <div className="flex flex-wrap gap-1">
                {getDayNames(s.recurrenceDays).map(day => (
                  <Badge key={day} variant="outline" className="text-xs px-2 py-0 border-[#644874]/30 text-[#644874] dark:border-[#644874]/40 dark:text-[#9d7fb0] hover:bg-transparent">
                    {day}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-[#644874]" />
                <span>{formatTime(s.startTime)} - {formatTime(s.endTime)}</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                {s.hasMultipleInstructors ? (
                  <>
                    <Users className="h-4 w-4 text-[#644874]" />
                    <span className="italic">Multiple instructors</span>
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 text-[#644874]" />
                    <span>{s.instructorName}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-[#644874]" />
                {s.hasMultipleLocations ? (
                  <span className="italic">Multiple locations</span>
                ) : (
                  <span className="truncate">
                    {s.location?.building || 'TBA'}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {s.seriesDescription}
            </p>

            {/* Click for details indicator */}
            <div className={`flex items-center justify-end gap-1 mt-3 text-xs font-medium transition-opacity duration-200 ${
              hoveredSeriesIds.includes(s.id) ? 'opacity-100' : 'opacity-0'
            } text-[#644874] dark:text-[#9d7fb0]`}>
              <span>View details</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedSeries && (
        <SeriesDetailsDialog
          series={selectedSeries}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}
