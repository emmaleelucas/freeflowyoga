"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapBoundsSetter } from "./map-bounds-setter";
import { SeriesWithDetails } from "@/lib/actions";
import { SeriesDetailsDialog } from "./series-details-dialog";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

// Dynamically import Leaflet components (they require window object)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

type ClassLocation = {
  building: string;
  address: string;
  seriesIds: number[];
};

interface CampusMapProps {
  series: SeriesWithDetails[];
  classLocations: ClassLocation[];
  allClassLocations: ClassLocation[]; // For geocoding all locations
  hoveredSeriesIds: number[];
  onPinHover: (ids: number[]) => void;
  onVisibleLocationsChange?: (locationAddresses: string[]) => void;
}

type LocationData = {
  address: string;
  building: string;
  lat: number;
  lng: number;
  seriesIds: number[];
  seriesCount: number;
};

// K-State campus center coordinates
const K_STATE_CENTER: LatLngExpression = [39.1942, -96.5816];

// Cache for geocoded addresses
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  // Check cache first
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address) || null;
  }

  try {
    // Use Nominatim (OpenStreetMap) free geocoding service
    const query = encodeURIComponent(`${address}, Manhattan, Kansas`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
      {
        headers: {
          'User-Agent': 'FreeFlowYoga/1.0' // Nominatim requires a User-Agent
        }
      }
    );

    const data = await response.json();

    if (data && data.length > 0) {
      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache.set(address, result);
      return result;
    }

    geocodeCache.set(address, null);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    geocodeCache.set(address, null);
    return null;
  }
}

// Tooltip position type
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

// Tooltip data type for the active tooltip
type ActiveTooltipData = {
  locationAddress: string;
  style: React.CSSProperties;
  position: TooltipPosition;
} | null;

// Custom marker component that animates on hover
function AnimatedMarker({
  location,
  isHighlighted,
  onHover,
  icon,
  onMarkerClick,
  markerRef,
}: {
  location: LocationData;
  isHighlighted: boolean;
  onHover: (hover: boolean) => void;
  icon: any;
  onMarkerClick: (markerRef: any) => void;
  markerRef: React.RefObject<any>;
}) {
  const iconsRef = useRef<{ highlighted: any; normal: any } | null>(null);

  // Create icons once on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        const highlightedIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div class="marker-container highlighted">
              <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 26 16 26s16-17.163 16-26C32 7.163 24.837 0 16 0z" fill="#6B92B5"/>
                <circle cx="16" cy="16" r="6" fill="white"/>
              </svg>
            </div>
          `,
          iconSize: [32, 42],
          iconAnchor: [16, 42],
        });

        const normalIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div class="marker-container">
              <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 26 16 26s16-17.163 16-26C32 7.163 24.837 0 16 0z" fill="#644874"/>
                <circle cx="16" cy="16" r="6" fill="white"/>
              </svg>
            </div>
          `,
          iconSize: [32, 42],
          iconAnchor: [16, 42],
        });

        iconsRef.current = { highlighted: highlightedIcon, normal: normalIcon };
      });
    }
  }, []);

  // Update icon when highlight state changes
  useEffect(() => {
    if (markerRef.current && iconsRef.current) {
      const targetIcon = isHighlighted ? iconsRef.current.highlighted : iconsRef.current.normal;
      markerRef.current.setIcon(targetIcon);
    }
  }, [isHighlighted, markerRef]);

  const handleMarkerClick = () => {
    onMarkerClick(markerRef.current);
  };

  const handlePinMouseOver = () => onHover(true);
  const handlePinMouseOut = () => onHover(false);

  return (
    <Marker
      ref={markerRef}
      position={[location.lat, location.lng]}
      icon={icon}
      eventHandlers={{
        click: handleMarkerClick,
        mouseover: handlePinMouseOver,
        mouseout: handlePinMouseOut,
      }}
    />
  );
}

// Inner component that uses the useMap hook - this must be inside MapContainer
function VisibleLocationTrackerInner({
  locations,
  onVisibleLocationsChange,
}: {
  locations: LocationData[];
  onVisibleLocationsChange?: (locationAddresses: string[]) => void;
}) {
  const InnerComponent = useMemo(() => {
    return dynamic(
      () =>
        import("react-leaflet").then((mod) => {
          const { useMap } = mod;
          return {
            default: () => {
              const map = useMap();

              useEffect(() => {
                if (!onVisibleLocationsChange || locations.length === 0) return;

                const handleUpdate = () => {
                  const bounds = map.getBounds();
                  const visibleAddresses = locations
                    .filter((loc) => bounds.contains([loc.lat, loc.lng]))
                    .map((loc) => loc.address);

                  console.log("Map updated, visible addresses:", visibleAddresses);
                  onVisibleLocationsChange(visibleAddresses);
                };

                // Initial call
                handleUpdate();

                // Attach listeners
                map.on("moveend", handleUpdate);
                map.on("zoomend", handleUpdate);

                return () => {
                  map.off("moveend", handleUpdate);
                  map.off("zoomend", handleUpdate);
                };
              }, [locations, onVisibleLocationsChange]);

              return null;
            },
          };
        }),
      { ssr: false }
    ) as any;
  }, []);

  return <InnerComponent />;
}

// Wrapper component to be used inside MapContainer
function VisibleLocationTracker({
  locations,
  onVisibleLocationsChange,
}: {
  locations: LocationData[];
  onVisibleLocationsChange?: (locationAddresses: string[]) => void;
}) {
  return <VisibleLocationTrackerInner locations={locations} onVisibleLocationsChange={onVisibleLocationsChange} />;
}

export function CampusMap({ series, classLocations, allClassLocations, hoveredSeriesIds, onPinHover, onVisibleLocationsChange }: CampusMapProps) {
  const [allGeocodedLocations, setAllGeocodedLocations] = useState<LocationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [customIcon, setCustomIcon] = useState<any>(null);
  const [hoveredLocationAddress, setHoveredLocationAddress] = useState<string | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<SeriesWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const geocodedAddressesRef = useRef<Set<string>>(new Set());
  const isGeocodingRef = useRef(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapKeyRef = useRef(`map-${Date.now()}`);

  // Ensure component is mounted before rendering map (fixes SSR issues)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Active tooltip state - only one tooltip can be open at a time
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltipData>(null);
  const [currentSeriesIdx, setCurrentSeriesIdx] = useState(0);

  // Store refs for all markers
  const markerRefs = useRef<Map<string, any>>(new Map());

  // Filter geocoded locations based on current classLocations prop
  const locations = useMemo(() => {
    const currentAddresses = new Set(classLocations.map(loc => loc.address));
    return allGeocodedLocations
      .filter(loc => currentAddresses.has(loc.address))
      .map(loc => {
        // Update seriesIds from the current classLocations
        const currentLocation = classLocations.find(cl => cl.address === loc.address);
        return {
          ...loc,
          seriesIds: currentLocation?.seriesIds || [],
          seriesCount: currentLocation?.seriesIds.length || 0,
        };
      });
  }, [allGeocodedLocations, classLocations]);

  // Create custom icon
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `
            <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 26 16 26s16-17.163 16-26C32 7.163 24.837 0 16 0z" fill="#644874"/>
              <circle cx="16" cy="16" r="6" fill="white"/>
            </svg>
          `,
          iconSize: [32, 42],
          iconAnchor: [16, 42],
        });
        setCustomIcon(icon);
      });
    }
  }, []);

  // Geocode all unique addresses (handles new locations being added)
  useEffect(() => {
    if (allClassLocations.length === 0 || isGeocodingRef.current) return;

    // Find locations that haven't been geocoded yet
    const newLocations = allClassLocations.filter(
      loc => !geocodedAddressesRef.current.has(loc.address)
    );

    if (newLocations.length === 0) {
      setIsLoading(false);
      return;
    }

    async function geocodeLocations() {
      isGeocodingRef.current = true;
      setIsLoading(true);
      const newLocationData: LocationData[] = [];

      for (const location of newLocations) {
        // Skip if already geocoded (in case of race condition)
        if (geocodedAddressesRef.current.has(location.address)) continue;

        // Add delay between requests to respect rate limits (1 request per second)
        await new Promise(resolve => setTimeout(resolve, 1000));

        const coords = await geocodeAddress(location.address);
        if (coords) {
          newLocationData.push({
            address: location.address,
            building: location.building,
            lat: coords.lat,
            lng: coords.lng,
            seriesIds: location.seriesIds,
            seriesCount: location.seriesIds.length,
          });
          geocodedAddressesRef.current.add(location.address);
        }
      }

      // Merge new locations with existing ones
      setAllGeocodedLocations(prev => [...prev, ...newLocationData]);
      setIsLoading(false);
      isGeocodingRef.current = false;
    }

    geocodeLocations();
  }, [allClassLocations]);

  // Calculate tooltip position based on marker position within map bounds
  const calculateTooltipPosition = (marker: any, locationAddress: string) => {
    if (!marker || !mapContainerRef.current) return;

    const map = marker._map;
    if (!map) return;

    const markerLatLng = marker.getLatLng();
    const markerPoint = map.latLngToContainerPoint(markerLatLng);
    const mapContainer = mapContainerRef.current;
    const mapRect = mapContainer.getBoundingClientRect();

    const tooltipWidth = 288; // w-72 = 18rem = 288px
    const tooltipHeight = 220; // approximate height
    const markerHeight = 42;
    const padding = 10;

    // Calculate available space in each direction
    const spaceTop = markerPoint.y - markerHeight;
    const spaceBottom = mapRect.height - markerPoint.y;
    const spaceLeft = markerPoint.x;
    const spaceRight = mapRect.width - markerPoint.x;

    let position: TooltipPosition = 'top';
    let style: React.CSSProperties = {};

    // Determine best position - prefer top, then bottom, then sides
    if (spaceTop >= tooltipHeight + padding) {
      position = 'top';
      let leftPos = markerPoint.x;
      // Adjust horizontal position if needed
      if (leftPos - tooltipWidth / 2 < padding) {
        leftPos = tooltipWidth / 2 + padding;
      } else if (leftPos + tooltipWidth / 2 > mapRect.width - padding) {
        leftPos = mapRect.width - tooltipWidth / 2 - padding;
      }
      style = {
        left: leftPos,
        top: markerPoint.y - markerHeight - padding,
        transform: 'translate(-50%, -100%)',
      };
    } else if (spaceBottom >= tooltipHeight + padding) {
      position = 'bottom';
      let leftPos = markerPoint.x;
      if (leftPos - tooltipWidth / 2 < padding) {
        leftPos = tooltipWidth / 2 + padding;
      } else if (leftPos + tooltipWidth / 2 > mapRect.width - padding) {
        leftPos = mapRect.width - tooltipWidth / 2 - padding;
      }
      style = {
        left: leftPos,
        top: markerPoint.y + padding,
        transform: 'translate(-50%, 0)',
      };
    } else if (spaceRight >= tooltipWidth + padding) {
      position = 'right';
      style = {
        left: markerPoint.x + 20,
        top: Math.min(Math.max(markerPoint.y - tooltipHeight / 2, padding), mapRect.height - tooltipHeight - padding),
        transform: 'translate(0, 0)',
      };
    } else if (spaceLeft >= tooltipWidth + padding) {
      position = 'left';
      style = {
        left: markerPoint.x - 20 - tooltipWidth,
        top: Math.min(Math.max(markerPoint.y - tooltipHeight / 2, padding), mapRect.height - tooltipHeight - padding),
        transform: 'translate(0, 0)',
      };
    } else {
      // Fallback - place in center of available space
      position = 'top';
      style = {
        left: mapRect.width / 2,
        top: padding + tooltipHeight,
        transform: 'translate(-50%, -100%)',
      };
    }

    setActiveTooltip({
      locationAddress,
      style,
      position,
    });
    setCurrentSeriesIdx(0);
  };

  const handleMarkerClick = (marker: any, locationAddress: string) => {
    if (activeTooltip?.locationAddress === locationAddress) {
      // Clicking same pin closes tooltip
      setActiveTooltip(null);
      onPinHover([]);
    } else {
      // Clicking new pin opens its tooltip (closes any existing)
      calculateTooltipPosition(marker, locationAddress);
    }
  };

  const handleCloseTooltip = () => {
    setActiveTooltip(null);
    onPinHover([]);
  };

  // Helper functions for tooltip content
  const dayNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
  const getDaysDisplay = (recurrenceDays: number[]) => {
    return [...recurrenceDays].sort((a, b) => a - b).map(d => dayNames[d]).join(', ');
  };
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Get active location and its series for the tooltip
  const activeLocation = activeTooltip ? locations.find(l => l.address === activeTooltip.locationAddress) : null;
  const activeLocationSeries = activeLocation ? series.filter(s => activeLocation.seriesIds.includes(s.id)) : [];
  const currentSeries = activeLocationSeries[currentSeriesIdx];

  // Update hovered series when tooltip is open and current series changes
  useEffect(() => {
    if (activeTooltip && currentSeries) {
      onPinHover([currentSeries.id]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTooltip?.locationAddress, currentSeriesIdx]);

  return (
    <div className="sticky top-8 h-full">
      <div ref={mapContainerRef} className="relative w-full h-full rounded-lg overflow-hidden border-2 border-[#644874]/30 dark:border-[#644874]/40">
        {!isMounted || isLoading ? (
          <div className="w-full h-full bg-gradient-to-br from-[#644874]/5 via-white to-[#6B92B5]/5 dark:from-[#644874]/10 dark:via-background dark:to-[#6B92B5]/10 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#644874] mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        ) : locations.length === 0 ? (
          <div className="w-full h-full bg-gradient-to-br from-[#644874]/5 via-white to-[#6B92B5]/5 dark:from-[#644874]/10 dark:via-background dark:to-[#6B92B5]/10 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>No class locations available</p>
            </div>
          </div>
        ) : (
          <>
            <MapContainer
              key={mapKeyRef.current}
              center={K_STATE_CENTER}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              className="z-0 simplified-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                className="map-tiles"
              />
              <MapBoundsSetter locations={locations} />
              <VisibleLocationTracker locations={locations} onVisibleLocationsChange={onVisibleLocationsChange} />
              {locations.map((location, idx) => {
                // Highlight pin if:
                // 1. This specific location is being directly hovered, OR
                // 2. A card is being hovered (not a pin) and this location has that series
                // 3. The tooltip is open for this location
                const isHighlighted =
                  hoveredLocationAddress === location.address ||
                  activeTooltip?.locationAddress === location.address ||
                  (hoveredSeriesIds.length > 0 &&
                   hoveredLocationAddress === null &&
                   hoveredSeriesIds.some(id => location.seriesIds.includes(id)));

                // Create a ref for this marker
                const markerKey = `${location.address}-${idx}`;
                if (!markerRefs.current.has(markerKey)) {
                  markerRefs.current.set(markerKey, { current: null });
                }
                const markerRef = markerRefs.current.get(markerKey)!;

                return (
                  <AnimatedMarker
                    key={markerKey}
                    location={location}
                    isHighlighted={isHighlighted}
                    icon={customIcon}
                    markerRef={markerRef}
                    onMarkerClick={(marker) => handleMarkerClick(marker, location.address)}
                    onHover={(hover) => {
                      setHoveredLocationAddress(hover ? location.address : null);
                      onPinHover(hover ? location.seriesIds : []);
                    }}
                  />
                );
              })}
            </MapContainer>

            {/* Tooltip - rendered outside MapContainer but inside the map wrapper */}
            {activeTooltip && activeLocation && (
              <div
                className="absolute z-[9999] w-72 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/40 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(100,72,116,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-4"
                style={{
                  ...activeTooltip.style,
                  pointerEvents: 'auto',
                }}
              >
                {/* Close button */}
                <button
                  onClick={handleCloseTooltip}
                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all"
                  aria-label="Close"
                >
                  <span className="text-lg leading-none">×</span>
                </button>

                {/* Header with building name and address */}
                <div className="pb-3 border-b border-[#644874]/20 dark:border-[#644874]/30 mb-3 pr-6">
                  <p className="font-semibold text-base text-gray-800 dark:text-white">
                    {activeLocation.building}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {activeLocation.address}
                  </p>
                </div>

                {/* Series Pagination */}
                {activeLocationSeries.length > 0 && currentSeries && (
                  <div className="space-y-3">
                    {/* Series Info */}
                    <div className="backdrop-blur-sm bg-[#644874]/10 dark:bg-[#644874]/15 rounded-xl p-3 border border-[#644874]/20 dark:border-[#644874]/25">
                      <p className="font-medium text-sm text-[#644874] dark:text-[#9d7fb0] mb-2">
                        {currentSeries.seriesName}
                      </p>
                      <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                        <p>{getDaysDisplay(currentSeries.recurrenceDays)}</p>
                        <p className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#644874] dark:text-[#9d7fb0]" />
                          <span>{formatTime(currentSeries.startTime)} - {formatTime(currentSeries.endTime)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Learn More Button */}
                    <button
                      onClick={() => {
                        setSelectedSeries(currentSeries);
                        setDialogOpen(true);
                      }}
                      className="w-full py-2 px-3 bg-gradient-to-r from-[#644874] to-[#6B92B5] hover:from-[#553965] hover:to-[#5A7FA0] text-white text-xs font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                      Learn More
                    </button>

                    {/* Pagination Controls */}
                    {activeLocationSeries.length > 1 && (
                      <div className="flex items-center justify-center gap-3 pt-1">
                        <button
                          onClick={() => setCurrentSeriesIdx((i) => (i - 1 + activeLocationSeries.length) % activeLocationSeries.length)}
                          className="p-1.5 backdrop-blur-sm bg-white/50 dark:bg-white/10 border border-white/40 dark:border-white/10 text-[#644874] dark:text-[#9d7fb0] rounded-lg hover:bg-white/80 dark:hover:bg-white/20 transition-all"
                          aria-label="Previous series"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[40px] text-center">
                          {currentSeriesIdx + 1} / {activeLocationSeries.length}
                        </span>
                        <button
                          onClick={() => setCurrentSeriesIdx((i) => (i + 1) % activeLocationSeries.length)}
                          className="p-1.5 backdrop-blur-sm bg-white/50 dark:bg-white/10 border border-white/40 dark:border-white/10 text-[#644874] dark:text-[#9d7fb0] rounded-lg hover:bg-white/80 dark:hover:bg-white/20 transition-all"
                          aria-label="Next series"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>


      <style jsx global>{`
        .simplified-map {
          border-radius: 0.5rem;
        }

        .simplified-map .leaflet-container {
          background: linear-gradient(135deg, #f8f6fa 0%, #f5f3f7 50%, #f0eef5 100%);
          font-family: inherit;
        }

        .dark .simplified-map .leaflet-container {
          background: linear-gradient(135deg, #1a1520 0%, #1f1a26 50%, #241e2c 100%);
        }

        /* Add subtle purple tint to map tiles */
        .simplified-map .map-tiles {
          filter: saturate(0.3) contrast(0.9);
          opacity: 0.85;
        }

        .dark .simplified-map .map-tiles {
          filter: saturate(0.4) brightness(0.7) contrast(1.1);
          opacity: 0.75;
        }

        /* Style map controls to match theme */
        .simplified-map .leaflet-top.leaflet-left {
          top: auto !important;
          bottom: 10px !important;
          left: 10px !important;
          right: auto !important;
        }

        .simplified-map .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 6px -1px rgba(100, 72, 116, 0.1), 0 2px 4px -1px rgba(100, 72, 116, 0.06) !important;
        }

        .simplified-map .leaflet-control-zoom-in,
        .simplified-map .leaflet-control-zoom-out {
          background: white !important;
          border: none !important;
          border-radius: 8px !important;
          color: #644874 !important;
          font-weight: 700 !important;
          font-size: 18px !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 34px !important;
          margin: 4px !important;
          transition: all 0.2s ease !important;
        }

        .dark .simplified-map .leaflet-control-zoom-in,
        .dark .simplified-map .leaflet-control-zoom-out {
          background: #1f1a26 !important;
          color: #9d7fb0 !important;
          box-shadow: 0 4px 6px -1px rgba(100, 72, 116, 0.2), 0 2px 4px -1px rgba(100, 72, 116, 0.1) !important;
        }

        .simplified-map .leaflet-control-zoom-in:hover,
        .simplified-map .leaflet-control-zoom-out:hover {
          background: #f0eef5 !important;
          color: #553965 !important;
          transform: scale(1.05) !important;
          box-shadow: 0 6px 8px -2px rgba(100, 72, 116, 0.2), 0 4px 6px -1px rgba(100, 72, 116, 0.1) !important;
        }

        .dark .simplified-map .leaflet-control-zoom-in:hover,
        .dark .simplified-map .leaflet-control-zoom-out:hover {
          background: #241e2c !important;
          color: #b99cc9 !important;
          transform: scale(1.05) !important;
          box-shadow: 0 6px 8px -2px rgba(100, 72, 116, 0.3), 0 4px 6px -1px rgba(100, 72, 116, 0.15) !important;
        }

        .simplified-map .leaflet-control-zoom-in {
          margin-bottom: 2px !important;
        }

        .simplified-map .leaflet-control-zoom-out {
          margin-top: 2px !important;
        }

        /* Style attribution */
        .simplified-map .leaflet-control-attribution {
          background: rgba(255, 255, 255, 0.7) !important;
          backdrop-filter: blur(4px);
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .dark .simplified-map .leaflet-control-attribution {
          background: rgba(31, 26, 38, 0.7) !important;
          color: #9d7fb0;
        }

        .dark .simplified-map .leaflet-control-attribution a {
          color: #b99cc9;
        }

        .custom-marker {
          background: none;
          border: none;
        }

        .marker-container {
          transition: transform 0.2s ease-out;
          transform-origin: center bottom;
        }

        .marker-container.highlighted {
          transform: scale(1.3);
          filter: drop-shadow(0 4px 8px rgba(107, 146, 181, 0.5));
        }

        .simplified-map .leaflet-control-zoom {
          z-index: 100 !important;
        }
      `}</style>

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
