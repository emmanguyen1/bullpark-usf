export interface WeatherCondition {
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

export interface SweatEvaluation {
  heatIndexF: number;
  sweatScore: number; // 0 - 100 (0 = breezy/cool, 100 = extreme Florida heat stroke hazard)
  comfortRating: 'Comfortable' | 'Warm' | 'Sweaty' | 'Severe Heat' | 'Drenched (Rain)';
  badgeMessage: string;
  recommendedCoveredParking: boolean;
}
