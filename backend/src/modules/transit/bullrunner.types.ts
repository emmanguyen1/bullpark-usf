import { GeoCoordinate } from '../campus/campus.types';

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
