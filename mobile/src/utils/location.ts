import * as Location from 'expo-location';

// ─── Types ───────────────────────────────────────────────────
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export type LocationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'error';

export class LocationError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'LocationError';
    this.code = code;
  }
}

// ─── Permission ──────────────────────────────────────────────
/**
 * Request foreground location permission.
 * Returns true if granted, false otherwise.
 */
export async function requestLocationPermission(): Promise<boolean> {
  const { status: existingStatus } =
    await Location.getForegroundPermissionsAsync();

  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

// ─── Get Current Location ────────────────────────────────────
/**
 * Get the device's current GPS coordinates.
 * Throws LocationError if permission is denied or location unavailable.
 */
export async function getCurrentLocation(): Promise<LocationData> {
  // Check permission first
  const granted = await requestLocationPermission();
  if (!granted) {
    throw new LocationError(
      'Location permission was denied. Please enable it in your device settings.',
      'PERMISSION_DENIED'
    );
  }

  // Check if location services are enabled
  const enabled = await Location.hasServicesEnabledAsync();
  if (!enabled) {
    throw new LocationError(
      'Location services are turned off. Please enable GPS in your device settings.',
      'SERVICES_DISABLED'
    );
  }

  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    };
  } catch {
    throw new LocationError(
      'Unable to determine your location. Please try again.',
      'POSITION_UNAVAILABLE'
    );
  }
}

/**
 * Get a quick lower-accuracy location (faster response).
 * Falls back to high-accuracy if low-accuracy fails.
 */
export async function getQuickLocation(): Promise<LocationData> {
  const granted = await requestLocationPermission();
  if (!granted) {
    throw new LocationError(
      'Location permission was denied.',
      'PERMISSION_DENIED'
    );
  }

  try {
    const location = await Location.getLastKnownPositionAsync();
    if (location) {
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };
    }
  } catch {
    // Fall through to getCurrentPositionAsync
  }

  return getCurrentLocation();
}

/**
 * Format coordinates for display.
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
}
