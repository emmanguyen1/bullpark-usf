import { weatherService } from '../modules/weather-sweat/weather.service';

console.log('====================================================');
console.log('🧪 MODULE DEBUG: TAMPA SWEAT INDEX & WEATHER ROUTING');
console.log('====================================================\n');

console.log('--- 1. Evaluating Sweat Index for Different Walking Distances in Tampa Heat ---');
weatherService.setWeatherOverride({
  temperatureF: 92,
  relativeHumidity: 78,
  isRaining: false
});
const current = weatherService.getCurrentWeather();
console.log(`Current Weather: ${current.temperatureF}°F, ${current.relativeHumidity}% RH`);

const walkTimes = [3, 8, 15];
for (const mins of walkTimes) {
  const surfaceEval = weatherService.evaluateSweatIndex(mins, false);
  const garageEval = weatherService.evaluateSweatIndex(mins, true);
  console.log(`\nWalk Duration: ${mins} minutes`);
  console.log(`  Surface Lot:  Sweat Score ${surfaceEval.sweatScore}/100 [${surfaceEval.comfortRating}] -> "${surfaceEval.badgeMessage}"`);
  console.log(`  Covered Gar.: Sweat Score ${garageEval.sweatScore}/100 [${garageEval.comfortRating}] -> "${garageEval.badgeMessage}"`);
}

console.log('\n--- 2. Evaluating Sudden Tampa Afternoon Downpour ---');
weatherService.setWeatherOverride({ isRaining: true });
const rainEvalSurface = weatherService.evaluateSweatIndex(6, false);
const rainEvalGarage = weatherService.evaluateSweatIndex(6, true);
console.log(`Surface Lot in Rain:   "${rainEvalSurface.badgeMessage}"`);
console.log(`Covered Garage in Rain: "${rainEvalGarage.badgeMessage}"`);

console.log('\n✅ Weather & Sweat module debugging completed successfully.');
