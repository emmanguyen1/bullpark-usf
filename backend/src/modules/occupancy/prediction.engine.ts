import { FacilityOccupancy, GarageLevelOccupancy } from './occupancy.types';

// Typical USF Class end times where big turnover happens within a 15-minute window
export const USF_CLASS_TURNOVER_WINDOWS = [
  { hour: 10, minute: 45, label: '10:45 AM Morning Lecture Release' },
  { hour: 12, minute: 15, label: '12:15 PM Midday Class Release' },
  { hour: 13, minute: 45, label: '1:45 PM Early Afternoon Transition' },
  { hour: 15, minute: 15, label: '3:15 PM Afternoon Dismissal' },
  { hour: 16, minute: 45, label: '4:45 PM Peak Commuter Departure' },
  { hour: 18, minute: 15, label: '6:15 PM Early Evening Dismissal' }
];

// Calibration profiles for USF Tampa facilities based on campus geography and historical permit demand
export const FACILITY_DEMAND_PROFILES: Record<
  string,
  {
    baseMultiplier: number;
    peakHourStart: number;
    peakHourEnd: number;
    isFacultyRestrictedDaytime: boolean;
    isParkAndRide: boolean;
    turnoverSensitivity: number;
  }
> = {
  'lot-crescent-garage': {
    baseMultiplier: 1.14,
    peakHourStart: 9.5,
    peakHourEnd: 14.5,
    isFacultyRestrictedDaytime: false,
    isParkAndRide: false,
    turnoverSensitivity: 1.2
  },
  'lot-beard-garage': {
    baseMultiplier: 1.08,
    peakHourStart: 9.0,
    peakHourEnd: 15.0,
    isFacultyRestrictedDaytime: false,
    isParkAndRide: false,
    turnoverSensitivity: 1.1
  },
  'lot-collins-garage': {
    baseMultiplier: 0.98,
    peakHourStart: 10.0,
    peakHourEnd: 14.0,
    isFacultyRestrictedDaytime: false,
    isParkAndRide: false,
    turnoverSensitivity: 0.95
  },
  'lot-laurel-garage': {
    baseMultiplier: 0.93,
    peakHourStart: 10.0,
    peakHourEnd: 14.5,
    isFacultyRestrictedDaytime: false,
    isParkAndRide: false,
    turnoverSensitivity: 0.9
  },
  'lot-23b': {
    baseMultiplier: 1.18, // Prime central science surface lot fills to maximum early
    peakHourStart: 9.5,
    peakHourEnd: 15.0,
    isFacultyRestrictedDaytime: false,
    isParkAndRide: false,
    turnoverSensitivity: 1.3
  },
  'lot-8a': {
    baseMultiplier: 1.05,
    peakHourStart: 8.5,
    peakHourEnd: 16.5,
    isFacultyRestrictedDaytime: true, // Faculty only daytime, rapid clear out after 4:30 PM
    isParkAndRide: false,
    turnoverSensitivity: 0.8
  },
  'lot-38a': {
    baseMultiplier: 1.02,
    peakHourStart: 8.5,
    peakHourEnd: 16.5,
    isFacultyRestrictedDaytime: true,
    isParkAndRide: false,
    turnoverSensitivity: 0.8
  },
  'lot-43': {
    baseMultiplier: 0.28, // Giant 2,200 Yuengling Park & Ride always has huge excess capacity
    peakHourStart: 10.0,
    peakHourEnd: 14.0,
    isFacultyRestrictedDaytime: false,
    isParkAndRide: true,
    turnoverSensitivity: 0.4
  },
  'lot-sycamore': {
    baseMultiplier: 0.38, // North 850 Park & Ride
    peakHourStart: 10.0,
    peakHourEnd: 14.0,
    isFacultyRestrictedDaytime: false,
    isParkAndRide: true,
    turnoverSensitivity: 0.5
  }
};

/**
 * Calculates realistic base occupancy percentage for USF campus based on clock time.
 */
export function getBaseHourlyOccupancyPercentage(hour: number, minute: number): number {
  const timeFloat = hour + minute / 60;

  if (timeFloat < 6.5) return 6; // Overnight / early dawn
  if (timeFloat < 7.5) return 12 + (timeFloat - 6.5) * 16; // 6:30am - 7:30am early arrivals
  if (timeFloat < 8.5) return 28 + (timeFloat - 7.5) * 28; // 7:30am - 8:30am first lecture surge
  if (timeFloat < 10.0) return 56 + (timeFloat - 8.5) * 22; // 8:30am - 10:00am peak morning saturation
  if (timeFloat < 13.0) return 89 + (timeFloat - 10.0) * 1.5; // 10:00am - 1:00pm campus peak
  if (timeFloat < 15.0) return 86 - (timeFloat - 13.0) * 7; // 1:00pm - 3:00pm early afternoon easing
  if (timeFloat < 17.0) return 72 - (timeFloat - 15.0) * 14; // 3:00pm - 5:00pm commuter departure wave
  if (timeFloat < 18.5) return 44 - (timeFloat - 17.0) * 10; // 5:00pm - 6:30pm evening class transition
  if (timeFloat < 21.0) return 29 - (timeFloat - 18.5) * 6; // 6:30pm - 9:00pm late night lectures
  return 10; // Night
}

/**
 * Checks if current time is within a class turnover window (+/- 10 mins).
 */
export function checkTurnoverWindow(
  hour: number,
  minute: number
): { isTurnover: boolean; windowLabel?: string; minutesDelta?: number } {
  const currentTotalMins = hour * 60 + minute;

  for (const window of USF_CLASS_TURNOVER_WINDOWS) {
    const windowTotalMins = window.hour * 60 + window.minute;
    const delta = currentTotalMins - windowTotalMins;

    if (delta >= -8 && delta <= 12) {
      return {
        isTurnover: true,
        windowLabel: window.label,
        minutesDelta: delta
      };
    }
  }

  return { isTurnover: false };
}

/**
 * Generates realistic per-level garage occupancy breakdown.
 * In USF garages, lower floors (Level 1, 2) fill first, while higher and rooftop floors stay open.
 */
export function calculateGarageLevelsBreakdown(
  totalCapacity: number,
  occupiedSpots: number,
  totalLevels: number
): GarageLevelOccupancy[] {
  const spotsPerLevel = Math.round(totalCapacity / totalLevels);
  let remainingOccupied = occupiedSpots;
  const levels: GarageLevelOccupancy[] = [];

  for (let i = 1; i <= totalLevels; i++) {
    const isRooftop = i === totalLevels;
    const levelName = isRooftop ? `Level ${i} (Rooftop Open)` : `Level ${i}`;
    const levelCap = i === totalLevels ? totalCapacity - spotsPerLevel * (totalLevels - 1) : spotsPerLevel;

    // Lower levels fill much faster (up to 98% capacity before higher levels fill)
    let levelOccupied = 0;
    if (remainingOccupied > 0) {
      if (i < totalLevels - 1) {
        // High density lower floors
        levelOccupied = Math.min(levelCap, Math.round(remainingOccupied * 0.95));
      } else {
        // Upper / roof floors take the rest
        levelOccupied = Math.min(levelCap, remainingOccupied);
      }
      remainingOccupied -= levelOccupied;
    }

    const levelAvailable = Math.max(0, levelCap - levelOccupied);
    const levelPct = Math.min(100, Math.round((levelOccupied / levelCap) * 100));

    let status: GarageLevelOccupancy['status'] = 'open';
    if (levelPct >= 95) status = 'full';
    else if (levelPct >= 80) status = 'limited';

    levels.push({
      levelNumber: i,
      levelName,
      totalSpots: levelCap,
      availableSpots: levelAvailable,
      occupancyPercentage: levelPct,
      status
    });
  }

  return levels;
}
