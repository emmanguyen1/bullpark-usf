import { GeoCoordinate } from '../campus/campus.types';

const EARTH_RADIUS_METERS = 6371000;
// Campus footpath circuity multiplier: walking along sidewalks and around buildings is typically 25% longer than as-the-crow-flies
const CAMPUS_WALKING_CIRCUITY_FACTOR = 1.25;
// Average student walking speed: ~1.33 m/s (~4.8 km/h or ~3.0 mph), adjusted slightly for Florida humidity
const AVERAGE_WALKING_SPEED_MPS = 1.30;

/**
 * Calculates straight-line distance in meters between two coordinates via Haversine formula.
 */
export function calculateHaversineDistanceMeters(
  coord1: GeoCoordinate,
  coord2: GeoCoordinate
): number {
  const toRad = (angle: number) => (angle * Math.PI) / 180;

  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Estimates realistic walking distance along campus sidewalks.
 */
export function estimateCampusWalkingDistanceMeters(
  coord1: GeoCoordinate,
  coord2: GeoCoordinate
): number {
  const straightLine = calculateHaversineDistanceMeters(coord1, coord2);
  return Math.round(straightLine * CAMPUS_WALKING_CIRCUITY_FACTOR);
}

/**
 * Calculates estimated walking time in minutes.
 */
export function calculateWalkingTimeMinutes(distanceMeters: number): number {
  const timeSeconds = distanceMeters / AVERAGE_WALKING_SPEED_MPS;
  return Math.ceil(timeSeconds / 60);
}
