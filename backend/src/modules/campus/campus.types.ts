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
  afterHoursPermitsAllowed: PermitType[]; // e.g. 'S' unlocks after 5:30 PM on weekdays
  coordinates: GeoCoordinate;
  levels?: number;
  features: {
    evCharging: boolean;
    hasCoveredWalkwayNearby: boolean;
    bullRunnerStopNearby: string | null;
  };
}
