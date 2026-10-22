import { PermitType } from '../campus/campus.types';
import { RouteOption } from '../routing/routing.types';

export interface ClassSession {
  id: string;
  courseCode: string; // e.g. "FIN 3403"
  courseName: string; // e.g. "Principles of Finance"
  buildingCode: string; // e.g. "BSN"
  room: string; // e.g. "1201"
  daysOfWeek: number[]; // 1 = Monday, 2 = Tuesday, etc.
  startTime: string; // "11:00" (24h)
  endTime: string; // "12:15"
}

export interface UserCommutePreferences {
  targetArrivalBufferMinutes: number; // e.g. 10 (settle in classroom 10m before start)
  walkingPace: 'casual' | 'normal' | 'brisk'; // casual (1.1m/s), normal (1.35m/s), brisk (1.65m/s)
  commuteDriveMinutes: number; // e.g. 15m driving to USF campus
  departureOriginName: string; // e.g. "Off-Campus Apartment (Fowler Ave)"
  prioritizeCoveredIfRain: boolean;
}

export interface ClassTransition {
  fromClass: ClassSession;
  toClass: ClassSession;
  timeGapMinutes: number; // e.g. 15 mins or 70 mins between end of class 1 and start of class 2
  walkingDistanceMeters: number;
  walkingMinutes: number;
  isTightTransfer: boolean; // true if timeGapMinutes <= 20
  transferAlert: string;
}

export interface DayItineraryClass {
  classSession: ClassSession;
  status: 'completed' | 'current_or_next' | 'upcoming';
  buildingName: string;
  isFirstClassOfDay: boolean;
  isLastClassOfDay: boolean;
  transitionFromPrevious?: ClassTransition;
  transitionToNext?: ClassTransition;
}

export interface SmartDeparturePlan {
  classSession: ClassSession;
  destinationBuildingName: string;
  classStartTime: string;
  recommendedDepartureTime: string; // Campus arrival time
  departureFromOriginTime: string; // Time to leave residence
  minutesUntilDeparture: number; // Countdown in minutes
  bufferMinutes: number; // In-seat arrival buffer
  estimatedParkingSearchMinutes: number; // Dynamic parking search time based on lot capacity & floors
  estimatedDriveMinutes: number;
  walkingTimeMinutes: number;
  totalLeadTimeMinutes: number; // Drive + Park + Walk + Settle Buffer
  recommendedFloorGuidance?: string;
  recommendedLot: RouteOption | null;
  alertBanner: string;
  urgencyLevel: 'on_track' | 'prepare_to_leave' | 'leave_now' | 'hurry_late';
  timeline: Array<{
    time: string;
    event: string;
    icon: string;
    description: string;
  }>;
  // Multi-Class Sequence & Campus Transition Awareness
  previousClassToday: ClassSession | null;
  followingClassesToday: ClassSession[];
  isAlreadyOnCampus: boolean;
  campusTransferWalkMinutes?: number;
  campusTransferFromBuilding?: string;
  tightTransferWarning?: string;
  dayScheduleChain: DayItineraryClass[];
}
