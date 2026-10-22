import { BULL_RUNNER_ROUTES, BULL_RUNNER_STOPS } from './bullrunner.data';
import { MultimodalTransitOption, BullRunnerRoute, BullRunnerStop } from './bullrunner.types';
import { Building } from '../campus/campus.types';
import { calculateHaversineDistanceMeters } from '../routing/distance.util';

export class TransitService {
  getAllRoutes(): BullRunnerRoute[] {
    return BULL_RUNNER_ROUTES;
  }

  getAllStops(): BullRunnerStop[] {
    return BULL_RUNNER_STOPS;
  }

  /**
   * Generates a multimodal Park & Ride alternative (e.g. Park at Yuengling Lot 43 + Take Bull Runner Route A).
   */
  getMultimodalOptionForBuilding(destination: Building): MultimodalTransitOption | null {
    // Find closest stop to the destination building
    let closestStop: BullRunnerStop = BULL_RUNNER_STOPS[0];
    let minDistance = Infinity;

    for (const stop of BULL_RUNNER_STOPS) {
      const dist = calculateHaversineDistanceMeters(stop.coordinates, destination.coordinates);
      if (dist < minDistance) {
        minDistance = dist;
        closestStop = stop;
      }
    }

    // Connect Lot 43 (Yuengling Center) or Sycamore to destination
    const boardingStop = BULL_RUNNER_STOPS.find((s) => s.id === 'stop-yuengling')!;
    const matchingRoute = BULL_RUNNER_ROUTES.find((r) =>
      r.stops.some((s) => s.id === closestStop.id) && r.stops.some((s) => s.id === boardingStop.id)
    ) || BULL_RUNNER_ROUTES[0];

    const finalWalkMins = Math.max(1, Math.ceil(minDistance / 75)); // gentle walk from stop to building
    const shuttleWaitMins = Math.ceil(matchingRoute.frequencyMinutes / 2); // average wait time
    const shuttleRideMins = 5; // typical transit time across USF loop
    const walkToStopMins = 1; // parked right next to Yuengling terminal

    const totalMinutes = walkToStopMins + shuttleWaitMins + shuttleRideMins + finalWalkMins;

    return {
      parkLotId: 'lot-43',
      parkLotName: 'Lot 43 (Yuengling Center Park & Ride)',
      shuttleRouteName: matchingRoute.name,
      shuttleColor: matchingRoute.colorHex,
      boardingStop: boardingStop.name,
      destinationStop: closestStop.name,
      walkingToStopMinutes: walkToStopMins,
      shuttleWaitMinutes: shuttleWaitMins,
      shuttleRideMinutes: shuttleRideMins,
      finalWalkMinutes: finalWalkMins,
      totalTimeMinutes: totalMinutes,
      advantageDescription: `Avoid garage circling gridlock! Lot 43 has 1,000+ open spots. Hop on ${matchingRoute.name} right to ${closestStop.name}.`
    };
  }
}

export const transitService = new TransitService();
