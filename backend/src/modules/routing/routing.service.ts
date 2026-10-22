import { evaluateSweatAndWeather } from '../weather-sweat/sweat-index.calculator';
import { campusService } from '../campus/campus.service';
import { occupancyService } from '../occupancy/occupancy.service';
import { weatherService } from '../weather-sweat/weather.service';
import { transitService } from '../transit/transit.service';
import {
  calculateHaversineDistanceMeters,
  estimateCampusWalkingDistanceMeters,
  calculateWalkingTimeMinutes
} from './distance.util';
import { RouteOption, RoutingRequest } from './routing.types';

export class RoutingService {
  /**
   * Evaluates and ranks all campus parking facilities for a student's destination building,
   * factoring in permit legality, walking distance, current occupancy, and Florida weather.
   */
  findBestParkingOptions(request: RoutingRequest): {
    destinationName: string;
    evaluatedAt: string;
    userPermit: string;
    rankedOptions: RouteOption[];
    recommendedOption: RouteOption | null;
    multimodalFallback: any | null;
  } {
    const destination = campusService.getBuildingById(request.destinationBuildingId);
    if (!destination) {
      throw new Error(`Building with ID or Code '${request.destinationBuildingId}' not found.`);
    }

    const currentTime = request.currentTime || occupancyService.getEffectiveTime();
    const facilities = campusService.getAllFacilities();

    const currentWeather = {
      ...weatherService.getCurrentWeather(),
      ...(request.currentTemperatureF !== undefined ? { temperatureF: request.currentTemperatureF } : {}),
      ...(request.isRaining !== undefined ? { isRaining: request.isRaining } : {})
    };

    const options: RouteOption[] = facilities.map((facility) => {
      // 1. Permit legality check (standard vs after 5:30 PM rule)
      const legality = campusService.isPermitAllowed(facility, request.userPermit, currentTime);

      // 2. Geospatial walking calculation
      const straightLine = calculateHaversineDistanceMeters(
        facility.coordinates,
        destination.coordinates
      );
      const walkingDistance = estimateCampusWalkingDistanceMeters(
        facility.coordinates,
        destination.coordinates
      );
      const walkingMinutes = calculateWalkingTimeMinutes(walkingDistance);

      // 3. Occupancy check
      const occupancy = occupancyService.getFacilityOccupancy(facility.id);
      const occupancyPct = occupancy ? occupancy.occupancyPercentage : 50;
      const availableSpots = occupancy ? occupancy.availableSpots : 100;

      // 4. Sweat / Weather impact
      const sweat = evaluateSweatAndWeather(currentWeather, walkingMinutes, facility.isCovered);

      // 5. Composite Ranking Score (Lower score is better)
      // Factors:
      // - Walking time penalty (each minute adds 10 points)
      // - Legality penalty (illegal parking gets +1000 penalty points)
      // - Occupancy penalty (over 90% full adds heavy penalty)
      // - Weather penalty (uncovered lot in rain or high heat adds penalty)
      let score = walkingMinutes * 10;

      if (!legality.allowed) {
        score += 1000;
      }

      if (occupancyPct >= 95) {
        score += 80; // High chance of circling
      } else if (occupancyPct >= 85) {
        score += 30;
      }

      if (currentWeather.isRaining && !facility.isCovered) {
        score += 45; // Heavy rain penalty for uncovered walk
      } else if (sweat.sweatScore >= 75 && !facility.isCovered) {
        score += 25; // Florida heat penalty
      }

      return {
        facility,
        destination,
        straightLineDistanceMeters: straightLine,
        estimatedWalkingDistanceMeters: walkingDistance,
        walkingTimeMinutes: walkingMinutes,
        isLegal: legality.allowed,
        legalityReason: legality.reason,
        ruleType: legality.ruleType,
        currentOccupancyPercentage: occupancyPct,
        availableSpotsEstimate: availableSpots,
        turnoverNotes: occupancy?.turnoverNotes,
        turnoverTrend: occupancy?.turnoverTrend,
        levels: occupancy?.levels,
        weatherRecommendationBadge: sweat.badgeMessage,
        compositeRankScore: Math.round(score)
      };
    });

    // Sort by composite rank score ascending (best first)
    options.sort((a, b) => a.compositeRankScore - b.compositeRankScore);

    const legalOptions = options.filter((o) => o.isLegal);
    const recommendedOption = legalOptions.length > 0 ? legalOptions[0] : null;

    // Check if the top recommended garage is congested (>90%). If so, generate Bull Runner option!
    let multimodalFallback = null;
    if (recommendedOption && recommendedOption.currentOccupancyPercentage >= 90) {
      multimodalFallback = transitService.getMultimodalOptionForBuilding(destination);
    }

    return {
      destinationName: `${destination.code} - ${destination.name}`,
      evaluatedAt: currentTime.toLocaleTimeString(),
      userPermit: request.userPermit,
      rankedOptions: options,
      recommendedOption,
      multimodalFallback
    };
  }
}

export const routingService = new RoutingService();
