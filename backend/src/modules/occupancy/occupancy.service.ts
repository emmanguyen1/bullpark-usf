import { campusService } from '../campus/campus.service';
import { FacilityOccupancy } from './occupancy.types';
import {
  getBaseHourlyOccupancyPercentage,
  checkTurnoverWindow,
  FACILITY_DEMAND_PROFILES,
  calculateGarageLevelsBreakdown
} from './prediction.engine';

export class OccupancyService {
  private simulatedTime: Date | null = null;
  private facilityOverrides: Map<string, number> = new Map();

  /**
   * Sets a simulated clock for debugging (e.g., test 10:45 AM or 5:35 PM).
   */
  setSimulatedTime(time: Date | null): void {
    this.simulatedTime = time;
  }

  getEffectiveTime(): Date {
    return this.simulatedTime || new Date();
  }

  setFacilityOccupancyOverride(facilityId: string, percentage: number): void {
    this.facilityOverrides.set(facilityId, Math.min(100, Math.max(0, percentage)));
  }

  clearOverrides(): void {
    this.facilityOverrides.clear();
    this.simulatedTime = null;
  }

  getFacilityOccupancy(facilityId: string): FacilityOccupancy | null {
    const facility = campusService.getFacilityById(facilityId);
    if (!facility) return null;

    const effectiveTime = this.getEffectiveTime();
    const hour = effectiveTime.getHours();
    const minute = effectiveTime.getMinutes();
    const timeFloat = hour + minute / 60;

    let occupancyPct = this.facilityOverrides.get(facilityId);

    if (occupancyPct === undefined) {
      const basePct = getBaseHourlyOccupancyPercentage(hour, minute);
      const profile = FACILITY_DEMAND_PROFILES[facilityId] || {
        baseMultiplier: 1.0,
        peakHourStart: 10.0,
        peakHourEnd: 14.5,
        isFacultyRestrictedDaytime: false,
        isParkAndRide: false,
        turnoverSensitivity: 1.0
      };

      // Faculty lots (8A, 38A) have high daytime occupancy that sharply plummets after 4:30 PM
      if (profile.isFacultyRestrictedDaytime) {
        if (timeFloat >= 8.0 && timeFloat <= 16.25) {
          // Daytime staff parking: 82% to 91%
          occupancyPct = Math.round(82 + (facilityId === 'lot-8a' ? 6 : 2) + Math.sin(timeFloat) * 4);
        } else if (timeFloat > 16.25 && timeFloat <= 18.0) {
          // Rapid afternoon faculty departure wave: plummets to 20-30%
          const departureProgress = (timeFloat - 16.25) / 1.75;
          occupancyPct = Math.round(82 - departureProgress * 58);
        } else {
          // Evening & night: very low occupancy, perfect for student after-hours grace parking!
          occupancyPct = Math.round(18 + Math.cos(timeFloat) * 5);
        }
      } else if (profile.isParkAndRide) {
        // Park & ride surface lots have huge surplus capacity (Lot 43 has 2,200 bays)
        const peakFactor = timeFloat >= profile.peakHourStart && timeFloat <= profile.peakHourEnd ? 1.3 : 0.8;
        occupancyPct = Math.round(Math.min(48, Math.max(8, basePct * profile.baseMultiplier * peakFactor)));
      } else {
        // Commuter garages & central surface lots
        let adjusted = basePct * profile.baseMultiplier;

        // Class turnover temporary relief (-8% to -14% during dismissal as cars vacate)
        const turnover = checkTurnoverWindow(hour, minute);
        if (turnover.isTurnover) {
          adjusted -= 9 * profile.turnoverSensitivity;
        }

        // Add small deterministic variance based on minute & facility to avoid identical flat numbers
        const hash = facilityId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const microVariance = ((hash % 7) - 3) * 0.8;
        adjusted += microVariance;

        occupancyPct = Math.round(Math.min(99, Math.max(8, adjusted)));
      }
    }

    const totalCapacity = facility.totalCapacity;
    const occupiedSpots = Math.min(totalCapacity, Math.round((occupancyPct / 100) * totalCapacity));
    const availableSpots = Math.max(0, totalCapacity - occupiedSpots);

    // Turnover evaluation
    const turnover = checkTurnoverWindow(hour, minute);
    let status: FacilityOccupancy['status'] = 'available';
    let turnoverTrend: FacilityOccupancy['turnoverTrend'] = 'stable';
    let turnoverNotes = 'Standard campus flow.';

    if (occupancyPct >= 92) {
      status = 'congested';
      if (turnover.isTurnover) {
        turnoverTrend = 'clearing_soon';
        turnoverNotes = `Congested, BUT active class dismissal (${turnover.windowLabel}). Expect rapid spot turnover!`;
      } else {
        turnoverTrend = 'peak_locked';
        turnoverNotes = 'High congestion. Circling likely. Consider Bull Runner or upper decks.';
      }
    } else if (occupancyPct >= 75) {
      status = 'almost_full';
      if (turnover.isTurnover) {
        turnoverTrend = 'clearing_soon';
        turnoverNotes = `Class turnover underway (${turnover.windowLabel}). Continuous bay turnover.`;
      } else {
        turnoverTrend = 'increasing';
        turnoverNotes = 'Filling steadily as upcoming class bells approach.';
      }
    } else if (occupancyPct >= 45) {
      status = 'filling_fast';
      turnoverTrend = 'stable';
      turnoverNotes = 'Plenty of open spaces across floors.';
    } else {
      status = 'available';
      turnoverTrend = 'stable';
      turnoverNotes = 'Abundant parking bays open.';
    }

    // Garage level breakdown if applicable
    const levels =
      facility.type === 'garage' && facility.levels
        ? calculateGarageLevelsBreakdown(totalCapacity, occupiedSpots, facility.levels)
        : undefined;

    return {
      facilityId: facility.id,
      facilityName: facility.name,
      totalCapacity,
      occupiedSpots,
      availableSpots,
      occupancyPercentage: occupancyPct,
      status,
      turnoverTrend,
      turnoverNotes,
      levels,
      lastUpdated: effectiveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  getAllOccupancies(): FacilityOccupancy[] {
    const facilities = campusService.getAllFacilities();
    return facilities
      .map((f) => this.getFacilityOccupancy(f.id))
      .filter((o): o is FacilityOccupancy => o !== null);
  }
}

export const occupancyService = new OccupancyService();
