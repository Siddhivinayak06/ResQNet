// ─────────────────────────────────────────────────────────────
// ResQNet — Geospatial Utilities
// Haversine distance calculation, bounding box generation,
// and GeoJSON helper functions.
// ─────────────────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate the great-circle distance between two points
 * using the Haversine formula.
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Format a distance value into a human-readable string.
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Create a GeoJSON Point from latitude and longitude.
 * Note: GeoJSON uses [longitude, latitude] order.
 */
export function createGeoPoint(latitude: number, longitude: number) {
  return {
    type: 'Point' as const,
    coordinates: [longitude, latitude] as [number, number],
  };
}

/**
 * Extract latitude and longitude from a GeoJSON Point.
 */
export function extractLatLng(geoPoint: { coordinates: [number, number] }): {
  latitude: number;
  longitude: number;
} {
  return {
    latitude: geoPoint.coordinates[1],
    longitude: geoPoint.coordinates[0],
  };
}

/**
 * Calculate a bounding box around a center point.
 * Useful for pre-filtering before precise distance calculation.
 * @param radiusKm - Radius in kilometers
 * @returns MongoDB-compatible $box query bounds
 */
export function boundingBox(
  latitude: number,
  longitude: number,
  radiusKm: number,
): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
  const latDelta = radiusKm / 111.12; // 1 degree latitude ≈ 111.12 km
  const lonDelta = radiusKm / (111.12 * Math.cos((latitude * Math.PI) / 180));

  return {
    minLat: latitude - latDelta,
    maxLat: latitude + latDelta,
    minLon: longitude - lonDelta,
    maxLon: longitude + lonDelta,
  };
}

/**
 * Convert meters to radians for MongoDB $geoNear queries.
 */
export function metersToRadians(meters: number): number {
  return meters / (EARTH_RADIUS_KM * 1000);
}

/**
 * Estimate travel time based on distance and average speed.
 * @param distanceKm - Distance in kilometers
 * @param avgSpeedKmh - Average speed (default: 40 km/h for urban emergency)
 * @returns Estimated time in minutes
 */
export function estimateTravelTime(distanceKm: number, avgSpeedKmh: number = 40): number {
  return (distanceKm / avgSpeedKmh) * 60;
}
