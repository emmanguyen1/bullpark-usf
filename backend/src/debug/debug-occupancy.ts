import { occupancyService } from '../modules/occupancy/occupancy.service';
import { getBaseHourlyOccupancyPercentage, checkTurnoverWindow } from '../modules/occupancy/prediction.engine';

console.log('====================================================');
console.log('🧪 MODULE DEBUG: OCCUPANCY & CLASS TURNOVER PREDICTION');
console.log('====================================================\n');

// 1. Check Hourly Curve across campus
console.log('--- 1. USF Campus-Wide Baseline Hourly Curve ---');
const sampleHours = [7, 9, 11, 13, 15, 17, 18, 21];
for (const h of sampleHours) {
  const pct = Math.round(getBaseHourlyOccupancyPercentage(h, 0));
  const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
  console.log(`${String(h).padStart(2, '0')}:00 -> [${bar}] ${pct}% expected full`);
}

console.log('\n--- 2. Class Changeover Detection Windows ---');
const testTimes = [
  { h: 10, m: 48, label: 'During 10:45 AM class release' },
  { h: 11, m: 30, label: 'Mid-lecture at 11:30 AM' },
  { h: 12, m: 18, label: 'During 12:15 PM class release' }
];

for (const t of testTimes) {
  const turnover = checkTurnoverWindow(t.h, t.m);
  console.log(`Time ${t.h}:${t.m} (${t.label}):`);
  console.log(`  Active Turnover? ${turnover.isTurnover ? 'YES 🟢' : 'NO ⚪'}`);
  if (turnover.isTurnover) {
    console.log(`  Window: ${turnover.windowLabel}`);
  }
}

console.log('\n--- 3. Real-Time Facility Snapshot (Current Simulated State) ---');
const facilities = occupancyService.getAllOccupancies();
for (const f of facilities.slice(0, 5)) {
  console.log(`• ${f.facilityName}:`);
  console.log(`    Capacity: ${f.occupiedSpots} / ${f.totalCapacity} (${f.occupancyPercentage}%)`);
  console.log(`    Status: [${f.status}] | Trend: [${f.turnoverTrend}]`);
  console.log(`    Notes: ${f.turnoverNotes}`);
}

console.log('\n✅ Occupancy module debugging completed successfully.');
