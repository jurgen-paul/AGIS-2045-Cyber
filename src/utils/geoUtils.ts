/**
 * Geographic calculation utilities for the AGIS Tactical SeekMap
 */

// Calculate great-circle distance between two [lat, lng] coordinates in kilometers
export function calculateDistanceKm(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;
  const R = 6371; // Earth's radius in km

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Map latitude and longitude to SVG canvas coordinates (width: 1000, height: 500)
// Uses an equirectangular projection with clamped bounds for display
export function latLngToCanvasXY(
  lat: number,
  lng: number,
  width = 1000,
  height = 500
): { x: number; y: number } {
  // Clamp lat [-85, 85] and lng [-180, 180]
  const clampedLat = Math.max(-85, Math.min(85, lat));
  const clampedLng = Math.max(-180, Math.min(180, lng));

  const x = ((clampedLng + 180) / 360) * width;
  // Latitude goes from +90 at top to -90 at bottom
  const y = ((90 - clampedLat) / 180) * height;

  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

// Format coordinates to readable string e.g. "52.7408° N, 6.0792° E"
export function formatCoordinates(coord: [number, number]): string {
  const [lat, lng] = coord;
  const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lngStr}`;
}

// Calculate velocity between two waypoints (km/h) given distance and time diff (ms)
export function calculateSpeedBetweenPoints(
  distKm: number,
  timeDiffMs: number
): number {
  if (timeDiffMs <= 0) return 0;
  const hours = timeDiffMs / (1000 * 60 * 60);
  return Math.round(distKm / hours);
}
