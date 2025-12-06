"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMap } from "react-leaflet";

type LocationData = {
  lat: number;
  lng: number;
};

export function MapBoundsSetter({ locations }: { locations: LocationData[] }) {
  const map = useMap();
  const previousLocationsKey = useRef<string>("");

  // Create a stable key from locations to detect when they actually change
  const locationsKey = useMemo(() => {
    return locations.map(loc => `${loc.lat},${loc.lng}`).sort().join('|');
  }, [locations]);

  useEffect(() => {
    // Only fit bounds if locations actually changed (not just re-rendered)
    if (locations.length > 0 && map && locationsKey !== previousLocationsKey.current) {
      previousLocationsKey.current = locationsKey;

      // Small delay to ensure map is fully ready
      setTimeout(() => {
        try {
          const bounds = locations.map(loc => [loc.lat, loc.lng] as [number, number]);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        } catch (e) {
          console.error('Error fitting bounds:', e);
        }
      }, 100);
    }
  }, [locationsKey, map, locations]);

  return null;
}
