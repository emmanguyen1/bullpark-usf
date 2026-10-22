import { WeatherCondition, SweatEvaluation } from './sweat-index.types';
import { evaluateSweatAndWeather } from './sweat-index.calculator';

const USF_TAMPA_LAT = 28.0587;
const USF_TAMPA_LON = -82.4139;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function decodeWeatherCode(code: number): { summary: string; isRaining: boolean } {
  if (code === 0) return { summary: 'Clear Sky', isRaining: false };
  if (code === 1) return { summary: 'Mainly Clear', isRaining: false };
  if (code === 2) return { summary: 'Partly Cloudy', isRaining: false };
  if (code === 3) return { summary: 'Overcast', isRaining: false };
  if (code >= 45 && code <= 48) return { summary: 'Tampa Morning Fog', isRaining: false };
  if (code >= 51 && code <= 57) return { summary: 'Light Drizzle', isRaining: true };
  if (code >= 61 && code <= 67) return { summary: 'Rain Showers', isRaining: true };
  if (code >= 80 && code <= 82) return { summary: 'Passing Downpour', isRaining: true };
  if (code >= 95) return { summary: 'Tampa Afternoon Thunderstorm', isRaining: true };
  return { summary: 'Partly Cloudy', isRaining: false };
}

export class WeatherService {
  private currentCondition: WeatherCondition = {
    temperatureF: 75,
    relativeHumidity: 65,
    isRaining: false,
    uvIndex: 7,
    summary: 'Partly Cloudy (USF Tampa)',
    apparentTemperatureF: 76,
    windSpeedMph: 7,
    precipitationInches: 0,
    precipitationProbability: 10,
    weatherCode: 2,
    lastUpdated: new Date().toISOString(),
    source: 'fallback_cache'
  };

  private lastFetchTime = 0;
  private isFetching = false;

  constructor() {
    // Attempt initial live weather fetch on startup
    this.refreshLiveWeather().catch(() => {
      // safe fallback
    });
  }

  async refreshLiveWeather(): Promise<WeatherCondition> {
    if (this.isFetching) return this.getCurrentWeather();
    this.isFetching = true;

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${USF_TAMPA_LAT}&longitude=${USF_TAMPA_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&forecast_days=1`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Weather API returned ${res.status}`);
      const data = await res.json() as any;

      if (data && data.current) {
        const c = data.current;
        const decoded = decodeWeatherCode(c.weather_code ?? 1);
        const isRaining =
          (c.rain || 0) > 0.01 ||
          (c.precipitation || 0) > 0.01 ||
          decoded.isRaining;

        // Process hourly forecast (next 6 hours)
        const hourlyForecast: WeatherCondition['hourlyForecast'] = [];
        if (data.hourly && Array.isArray(data.hourly.time)) {
          const nowHourStr = new Date().toISOString().slice(0, 13);
          const startIndex = Math.max(
            0,
            data.hourly.time.findIndex((t: string) => t.startsWith(nowHourStr))
          );
          const end = Math.min(startIndex + 6, data.hourly.time.length);
          for (let i = startIndex; i < end; i++) {
            const rawTime = data.hourly.time[i];
            const hour = new Date(rawTime).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
            hourlyForecast.push({
              time: hour,
              temperatureF: Math.round(data.hourly.temperature_2m[i]),
              rainProbability: Math.round(data.hourly.precipitation_probability[i] || 0),
              summary: decodeWeatherCode(data.hourly.weather_code[i] ?? 1).summary
            });
          }
        }

        this.currentCondition = {
          temperatureF: Math.round(c.temperature_2m),
          relativeHumidity: Math.round(c.relative_humidity_2m),
          apparentTemperatureF: Math.round(c.apparent_temperature),
          windSpeedMph: Math.round(c.wind_speed_10m),
          precipitationInches: c.precipitation || 0,
          precipitationProbability: hourlyForecast[0]?.rainProbability ?? 10,
          isRaining,
          uvIndex: 7,
          summary: decoded.summary,
          weatherCode: c.weather_code,
          lastUpdated: new Date().toISOString(),
          source: 'live_open_meteo',
          hourlyForecast
        };
        this.lastFetchTime = Date.now();
      }
    } catch (err: any) {
      // Set lastFetchTime on failure to avoid continuous tight loop retries
      this.lastFetchTime = Date.now();
      console.warn('Weather live fetch warning (using cache):', err.message);
    } finally {
      this.isFetching = false;
    }

    return this.getCurrentWeather();
  }

  getCurrentWeather(): WeatherCondition {
    // If cache expired and not recently fetched, trigger background refresh
    if (Date.now() - this.lastFetchTime > CACHE_TTL_MS && !this.isFetching) {
      this.refreshLiveWeather().catch(() => {});
    }
    return { ...this.currentCondition };
  }

  setWeatherOverride(override: Partial<WeatherCondition>): WeatherCondition {
    this.currentCondition = {
      ...this.currentCondition,
      ...override,
      source: 'manual_override',
      lastUpdated: new Date().toISOString()
    };
    return this.getCurrentWeather();
  }

  evaluateSweatIndex(walkingMinutes: number, isCoveredFacility: boolean): SweatEvaluation {
    return evaluateSweatAndWeather(this.currentCondition, walkingMinutes, isCoveredFacility);
  }
}

export const weatherService = new WeatherService();
