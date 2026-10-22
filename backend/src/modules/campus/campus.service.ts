import { USF_BUILDINGS, USF_PARKING_FACILITIES } from './campus.data';
import { Building, ParkingFacility, PermitType } from './campus.types';

export const USF_BUILDING_ALIASES: Record<string, string> = {
  ENB: 'ENG',
  ENC: 'ENG',
  ENA: 'ENG',
  KMI: 'ENG',
  NES: 'ENG',
  CMC: 'CIS',
  SCA: 'CHE',
  SCN: 'CHE',
  BSN2: 'BSN',
  EDU: 'CPR'
};

export class CampusService {
  getAllBuildings(): Building[] {
    return USF_BUILDINGS;
  }

  getBuildingById(id: string): Building | undefined {
    const upper = id.toUpperCase().trim();
    const direct = USF_BUILDINGS.find((b) => b.id.toUpperCase() === upper || b.code.toUpperCase() === upper);
    if (direct) return direct;
    const mapped = USF_BUILDING_ALIASES[upper];
    if (mapped) {
      return USF_BUILDINGS.find((b) => b.code.toUpperCase() === mapped);
    }
    return undefined;
  }

  getAllFacilities(): ParkingFacility[] {
    return USF_PARKING_FACILITIES;
  }

  getFacilityById(id: string): ParkingFacility | undefined {
    return USF_PARKING_FACILITIES.find((f) => f.id === id);
  }

  /**
   * Determines if a permit is legally valid for a specific parking facility at a given time.
   * Key USF Rule: S (Student) permits unlock E (Faculty/Staff) lots after 5:30 PM on weekdays and anytime on weekends.
   */
  isPermitAllowed(
    facility: ParkingFacility,
    permit: PermitType,
    currentTime: Date = new Date()
  ): { allowed: boolean; reason: string; ruleType: 'standard' | 'after-hours' | 'prohibited' } {
    // Check standard permit permissions
    if (facility.basePermitsAllowed.includes(permit)) {
      return {
        allowed: true,
        reason: `Permit [${permit}] is fully permitted during standard hours.`,
        ruleType: 'standard'
      };
    }

    // Check USF "After 5:30 PM & Weekends" grace rules
    const day = currentTime.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = day === 0 || day === 6;
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const isAfter530PM = hours > 17 || (hours === 17 && minutes >= 30);
    const isBefore7AM = hours < 7;

    const qualifiesForAfterHours = isWeekend || isAfter530PM || isBefore7AM;

    if (qualifiesForAfterHours && facility.afterHoursPermitsAllowed.includes(permit)) {
      return {
        allowed: true,
        reason: `Permit [${permit}] is unlocked under USF After-Hours Parking Rules (After 5:30 PM / Weekends).`,
        ruleType: 'after-hours'
      };
    }

    return {
      allowed: false,
      reason: `Permit [${permit}] is NOT permitted in ${facility.name} at this time (Reserved for ${facility.basePermitsAllowed.join(', ')}). Risk of USF Parking Citation ($30+).`,
      ruleType: 'prohibited'
    };
  }
}

export const campusService = new CampusService();
