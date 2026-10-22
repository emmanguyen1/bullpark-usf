import { ParkingFacility, Building, PermitType } from '../campus/campus.types';
import { GarageLevelOccupancy } from '../occupancy/occupancy.types';

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
  bullRunnerAlternative?: {
    shuttleLine: string;
    rideDurationMinutes: number;
    headwayMinutes: number;
    totalCommuteMinutes: number;
  };
  compositeRankScore: number; // lower is better
}

export interface RoutingRequest {
  destinationBuildingId: string;
  userPermit: PermitType;
  currentTime?: Date;
  currentTemperatureF?: number;
  isRaining?: boolean;
}
