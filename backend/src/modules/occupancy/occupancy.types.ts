export interface GarageLevelOccupancy {
  levelNumber: number;
  levelName: string;
  totalSpots: number;
  availableSpots: number;
  occupancyPercentage: number;
  status: 'open' | 'limited' | 'full';
}

export interface FacilityOccupancy {
  facilityId: string;
  facilityName: string;
  totalCapacity: number;
  occupiedSpots: number;
  availableSpots: number;
  occupancyPercentage: number;
  status: 'available' | 'filling_fast' | 'almost_full' | 'congested';
  turnoverTrend: 'increasing' | 'stable' | 'clearing_soon' | 'peak_locked';
  turnoverNotes: string;
  levels?: GarageLevelOccupancy[];
  lastUpdated: string;
}

export interface OccupancyHistoricalCurvePoint {
  hour: number;
  expectedOccupancyPercentage: number;
}
