import { transitService } from '../modules/transit/transit.service';
import { campusService } from '../modules/campus/campus.service';

console.log('====================================================');
console.log('🧪 MODULE DEBUG: BULL RUNNER TRANSIT & FALLBACK');
console.log('====================================================\n');

console.log('--- 1. Bull Runner Transit Network ---');
const routes = transitService.getAllRoutes();
for (const r of routes) {
  console.log(`• ${r.name} (Frequency: every ${r.frequencyMinutes} mins, Stops: ${r.stops.length})`);
}

console.log('\n--- 2. Multimodal Fallback for Central Campus Buildings ---');
const testBuildings = ['BSN', 'ENG', 'LIB'];

for (const bldgCode of testBuildings) {
  const building = campusService.getBuildingById(bldgCode);
  if (building) {
    const fallback = transitService.getMultimodalOptionForBuilding(building);
    console.log(`\nDestination: ${building.code} (${building.name})`);
    if (fallback) {
      console.log(`  Park Location: ${fallback.parkLotName}`);
      console.log(`  Shuttle Route: ${fallback.shuttleRouteName}`);
      console.log(`  Boarding Stop: ${fallback.boardingStop} -> Drop-off: ${fallback.destinationStop}`);
      console.log(`  Total Commute: ${fallback.totalTimeMinutes} mins (Shuttle ride: ${fallback.shuttleRideMinutes}m, Final walk: ${fallback.finalWalkMinutes}m)`);
      console.log(`  Advantage: "${fallback.advantageDescription}"`);
    }
  }
}

console.log('\n✅ Transit module debugging completed successfully.');
