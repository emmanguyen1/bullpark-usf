import { routingService } from '../modules/routing/routing.service';

console.log('====================================================');
console.log('🧪 MODULE DEBUG: ROUTING & PERMIT VALIDATION');
console.log('====================================================\n');

// Test Case 1: Student with 'S' permit going to BSN at 11:00 AM (Daytime)
console.log('--- Test Case 1: Commuter Student (Permit: S) -> Destination: BSN (11:00 AM Daytime) ---');
const dayResult = routingService.findBestParkingOptions({
  destinationBuildingId: 'BSN',
  userPermit: 'S',
  currentTime: new Date('2026-10-21T11:00:00')
});

console.log(`Destination: ${dayResult.destinationName}`);
console.log(`Evaluated At: ${dayResult.evaluatedAt}`);
console.log(`Top Recommended Lot: ${dayResult.recommendedOption?.facility.name}`);
console.log(`  - Walking Time: ${dayResult.recommendedOption?.walkingTimeMinutes} mins`);
console.log(`  - Sidewalk Distance: ${dayResult.recommendedOption?.estimatedWalkingDistanceMeters} m`);
console.log(`  - Occupancy: ${dayResult.recommendedOption?.currentOccupancyPercentage}%`);
console.log(`  - Legality: ${dayResult.recommendedOption?.legalityReason}`);
console.log(`  - Weather Advisory: ${dayResult.recommendedOption?.weatherRecommendationBadge}\n`);

// Test Case 2: Testing USF "After 5:30 PM Rule"
console.log('--- Test Case 2: Testing USF After 5:30 PM Rule for Lot 8A (Library Faculty Surface) ---');
const dayTimeCheck = routingService.findBestParkingOptions({
  destinationBuildingId: 'LIB',
  userPermit: 'S',
  currentTime: new Date('2026-10-21T14:00:00') // 2:00 PM
});
const lot8aDay = dayTimeCheck.rankedOptions.find((o) => o.facility.id === 'lot-8a');
console.log(`At 2:00 PM (Business Hours) -> Lot 8A Legal for 'S'? ${lot8aDay?.isLegal ? 'YES' : 'NO'}`);
console.log(`  Reason: ${lot8aDay?.legalityReason}`);

const nightTimeCheck = routingService.findBestParkingOptions({
  destinationBuildingId: 'LIB',
  userPermit: 'S',
  currentTime: new Date('2026-10-21T17:45:00') // 5:45 PM
});
const lot8aNight = nightTimeCheck.rankedOptions.find((o) => o.facility.id === 'lot-8a');
console.log(`At 5:45 PM (After-Hours)    -> Lot 8A Legal for 'S'? ${lot8aNight?.isLegal ? 'YES' : 'NO'}`);
console.log(`  Reason: ${lot8aNight?.legalityReason}\n`);

console.log('✅ Routing module debugging completed successfully.');
