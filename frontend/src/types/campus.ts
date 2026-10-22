export type PermitType = 'S' | 'R' | 'E' | 'D' | 'Y';

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

export interface Building {
  id: string;
  code: string;
  name: string;
  category: 'academic' | 'student-life' | 'athletics' | 'administration';
  coordinates: GeoCoordinate;
  description: string;
  popularDepartments: string[];
}

export interface ParkingFacility {
  id: string;
  name: string;
  type: 'garage' | 'surface_lot';
  isCovered: boolean;
  totalCapacity: number;
  basePermitsAllowed: PermitType[];
  afterHoursPermitsAllowed: PermitType[];
  coordinates: GeoCoordinate;
  levels?: number;
  features: {
    evCharging: boolean;
    hasCoveredWalkwayNearby: boolean;
    bullRunnerStopNearby: string | null;
  };
}

export interface GarageLevelOccupancy {
  levelNumber: number;
  levelName: string;
  totalSpots: number;
  availableSpots: number;
  occupancyPercentage: number;
  status: 'open' | 'limited' | 'full';
}

export interface RouteOption {
  facility: ParkingFacility;
  destination: Building;
  straightLineDistanceMeters: number;
  estimatedWalkingDistanceMeters: number;
  walkingTimeMinutes: number;
  isLegal: boolean;
  legalityReason: string;
  ruleType: 'standard' | 'after-hours' | 'prohibited';
  currentOccupancyPercentage: number;
  availableSpotsEstimate: number;
  turnoverNotes?: string;
  turnoverTrend?: string;
  levels?: GarageLevelOccupancy[];
  weatherRecommendationBadge?: string;
  compositeRankScore: number;
}

export interface MultimodalTransitOption {
  parkLotId: string;
  parkLotName: string;
  shuttleRouteName: string;
  shuttleColor: string;
  boardingStop: string;
  destinationStop: string;
  walkingToStopMinutes: number;
  shuttleWaitMinutes: number;
  shuttleRideMinutes: number;
  finalWalkMinutes: number;
  totalTimeMinutes: number;
  advantageDescription: string;
}

export interface RoutingResponse {
  destinationName: string;
  evaluatedAt: string;
  userPermit: string;
  rankedOptions: RouteOption[];
  recommendedOption: RouteOption | null;
  multimodalFallback: MultimodalTransitOption | null;
}

export interface ClassSession {
  id: string;
  courseCode: string;
  courseName: string;
  buildingCode: string;
  room: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
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

export interface LiveWeatherCondition {
  temperatureF: number;
  relativeHumidity: number;
  isRaining: boolean;
  uvIndex: number;
  summary: string;
  apparentTemperatureF?: number;
  windSpeedMph?: number;
  precipitationInches?: number;
  precipitationProbability?: number;
  weatherCode?: number;
  lastUpdated?: string;
  source?: 'live_open_meteo' | 'manual_override' | 'fallback_cache';
  hourlyForecast?: Array<{
    time: string;
    temperatureF: number;
    rainProbability: number;
    summary: string;
  }>;
}

export interface BullTradeSpot {
  id: string;
  facilityId: string;
  facilityName: string;
  levelOrSection: string;
  spotDescription: string;
  departureInMinutes: number;
  reportedBy: string;
  bullPointsReward: number;
  status: 'available' | 'claimed' | 'completed';
  claimedBy?: string;
  createdAt: string;
}

export interface BluetoothSignalEvent {
  eventType: 'DISCONNECTED' | 'CONNECTED';
  facilityId: string;
  facilityName: string;
  timestamp: string;
  inferredAction: string;
  impactDescription: string;
}

export interface BullRunnerStop {
  id: string;
  name: string;
  coordinates: GeoCoordinate;
  servicedRoutes: string[];
}

export interface BullRunnerRoute {
  id: string;
  name: string;
  colorHex: string;
  frequencyMinutes: number;
  stops: BullRunnerStop[];
}

export interface WeatherCondition {
  temperatureF: number;
  relativeHumidity: number;
  isRaining: boolean;
  uvIndex: number;
  summary: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  studentId?: string;
  major?: string;
  permitType: PermitType;
  commutePreferences: UserCommutePreferences;
  schedule: ClassSession[];
  pinnedCarLotId: string | null;
  pinnedCarTimestamp: string | null;
  favoriteBuildingCodes: string[];
  createdAt: string;
  updatedAt: string;
}
