import { haversineDistance, formatDistance } from '../utils/haversine.js';
import cache from '../utils/cache.js';
import MemoryCache from '../utils/cache.js';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Build an Overpass QL query that fetches hospitals, police stations,
 * and fire stations within a given radius of a coordinate.
 */
function buildOverpassQuery(lat, lon, radiusMeters) {
  return `
    [out:json][timeout:15];
    (
      node["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
      node["amenity"="police"](around:${radiusMeters},${lat},${lon});
      node["amenity"="fire_station"](around:${radiusMeters},${lat},${lon});
      way["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
      way["amenity"="police"](around:${radiusMeters},${lat},${lon});
      way["amenity"="fire_station"](around:${radiusMeters},${lat},${lon});
    );
    out center;
  `;
}

/**
 * Map OSM amenity types to human-readable service types.
 */
function mapServiceType(amenity) {
  const typeMap = {
    hospital: 'hospital',
    police: 'police_station',
    fire_station: 'fire_station',
  };
  return typeMap[amenity] || amenity;
}

/**
 * Parse raw Overpass elements into a clean service list with distances.
 */
function parseElements(elements, userLat, userLon) {
  return elements
    .map((el) => {
      // For 'way' results, coordinates are in el.center
      const lat = el.lat || (el.center && el.center.lat);
      const lon = el.lon || (el.center && el.center.lon);

      if (!lat || !lon) return null;

      const tags = el.tags || {};
      const distanceKm = haversineDistance(userLat, userLon, lat, lon);

      // Build address from available OSM tags
      const addressParts = [
        tags['addr:street'],
        tags['addr:housenumber'],
        tags['addr:city'],
        tags['addr:postcode'],
      ].filter(Boolean);

      return {
        name: tags.name || tags['name:en'] || `Unnamed ${mapServiceType(tags.amenity)}`,
        type: mapServiceType(tags.amenity),
        address: addressParts.length > 0 ? addressParts.join(', ') : null,
        phone: tags.phone || tags['contact:phone'] || null,
        distance: formatDistance(distanceKm),
        distanceKm: Math.round(distanceKm * 100) / 100,
        location: {
          lat,
          lng: lon,
        },
      };
    })
    .filter(Boolean);
}

/**
 * @desc    Get nearby emergency services (hospitals, police, fire stations)
 * @route   GET /api/services/nearby
 * @access  Public
 */
export const getNearbyServices = async (req, res, next) => {
  try {
    const { latitude, longitude, radius } = req.query;

    // ─── Validation ────────────────────────────────────────────
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'latitude and longitude query parameters are required',
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radiusKm = parseFloat(radius) || 5;

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        error: 'latitude must be a number between -90 and 90',
      });
    }

    if (isNaN(lon) || lon < -180 || lon > 180) {
      return res.status(400).json({
        success: false,
        error: 'longitude must be a number between -180 and 180',
      });
    }

    if (radiusKm <= 0 || radiusKm > 50) {
      return res.status(400).json({
        success: false,
        error: 'radius must be between 0 and 50 km',
      });
    }

    // ─── Check cache ───────────────────────────────────────────
    const cacheKey = MemoryCache.locationKey(lat, lon, radiusKm);
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.status(200).json({
        success: true,
        cached: true,
        count: cached.length,
        services: cached,
      });
    }

    // ─── Query Overpass API ────────────────────────────────────
    const radiusMeters = radiusKm * 1000;
    const query = buildOverpassQuery(lat, lon, radiusMeters);

    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      console.error(`Overpass API error: ${response.status} ${response.statusText}`);
      return res.status(502).json({
        success: false,
        error: 'Failed to fetch nearby services. External API unavailable.',
      });
    }

    const data = await response.json();
    const elements = data.elements || [];

    // ─── Parse & sort by distance ──────────────────────────────
    const services = parseElements(elements, lat, lon)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    // ─── Cache results for 5 minutes ───────────────────────────
    cache.set(cacheKey, services, CACHE_TTL);

    res.status(200).json({
      success: true,
      cached: false,
      count: services.length,
      services,
    });
  } catch (error) {
    next(error);
  }
};
