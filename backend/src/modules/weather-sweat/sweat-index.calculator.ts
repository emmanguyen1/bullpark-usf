import { WeatherCondition, SweatEvaluation } from './sweat-index.types';

/**
 * Calculates NOAA Heat Index in Fahrenheit.
 */
export function calculateHeatIndex(tempF: number, rh: number): number {
  if (tempF < 80) return tempF;

  const T = tempF;
  const R = rh;

  let hi =
    -42.379 +
    2.04901523 * T +
    10.14333127 * R -
    0.22475541 * T * R -
    0.00683783 * T * T -
    0.05481717 * R * R +
    0.00122874 * T * T * R +
    0.00085282 * T * R * R -
    0.00000199 * T * T * R * R;

  return Math.round(hi);
}

/**
 * Evaluates the "Tampa Sweat Index" for a given walk duration and parking facility type.
 */
export function evaluateSweatAndWeather(
  weather: WeatherCondition,
  walkingMinutes: number,
  isCoveredFacility: boolean
): SweatEvaluation {
  if (weather.isRaining) {
    return {
      heatIndexF: weather.temperatureF,
      sweatScore: 90,
      comfortRating: 'Drenched (Rain)',
      badgeMessage: isCoveredFacility
        ? 'Rain Alert: Covered garage keeps vehicle dry!'
        : 'Rain Alert: Uncovered lot — prepare for Tampa downpour walk',
      recommendedCoveredParking: true
    };
  }

  const heatIndex = calculateHeatIndex(weather.temperatureF, weather.relativeHumidity);

  // Base sweat score from Heat Index:
  // 75F -> ~15 score, 85F -> ~40 score, 95F -> ~75 score, 105F+ -> ~95+ score
  let baseScore = Math.max(0, (heatIndex - 65) * 2.3);

  // Time walking multiplier: walking 10+ mins in Florida sun multiplies discomfort
  const walkMultiplier = 1 + (walkingMinutes - 3) * 0.12;
  let finalScore = Math.round(baseScore * Math.max(0.7, walkMultiplier));

  // Covered garage discount (avoids stepping into a 130°F baked car later!)
  if (isCoveredFacility) {
    finalScore = Math.max(0, finalScore - 12);
  }

  finalScore = Math.min(100, Math.max(0, finalScore));

  let comfortRating: SweatEvaluation['comfortRating'] = 'Comfortable';
  let badgeMessage = 'Pleasant walking conditions';

  if (finalScore >= 80) {
    comfortRating = 'Severe Heat';
    badgeMessage = `Extreme Heat Index (${heatIndex}°F). ${walkingMinutes} min walk will be brutal. Park closer!`;
  } else if (finalScore >= 60) {
    comfortRating = 'Sweaty';
    badgeMessage = `High Sweat Risk (${heatIndex}°F). Covered parking highly advised.`;
  } else if (finalScore >= 35) {
    comfortRating = 'Warm';
    badgeMessage = `Typical Tampa Warmth (${heatIndex}°F). Manageable ${walkingMinutes}-min walk.`;
  }

  return {
    heatIndexF: heatIndex,
    sweatScore: finalScore,
    comfortRating,
    badgeMessage,
    recommendedCoveredParking: heatIndex >= 88 || weather.isRaining
  };
}
