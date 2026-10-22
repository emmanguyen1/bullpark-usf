import { scheduleService } from '../modules/schedule/schedule.service';

console.log('====================================================');
console.log('🧪 MODULE DEBUG: SCHEDULE SYNC & SMART DEPARTURE');
console.log('====================================================\n');

console.log('--- 1. Loaded Student Class Schedule ---');
const classes = scheduleService.getSchedule();
for (const c of classes) {
  console.log(`• [${c.courseCode}] ${c.courseName} | ${c.buildingCode} Room ${c.room} | Days: ${c.daysOfWeek.join(',')} | Time: ${c.startTime} - ${c.endTime}`);
}

console.log('\n--- 2. Generating Next Class Smart Departure Plan ---');
// Test simulating 10:15 AM on a Tuesday (Day 2)
const simulatedTime = new Date('2026-10-20T10:15:00'); // Tuesday
const plan = scheduleService.getNextDeparturePlan('S', simulatedTime);

if (plan) {
  console.log(`Class Target: ${plan.classSession.courseCode} (${plan.classSession.courseName})`);
  console.log(`Location: ${plan.destinationBuildingName} [${plan.classSession.buildingCode} ${plan.classSession.room}]`);
  console.log(`Class Starts At: ${plan.classStartTime}`);
  console.log(`Recommended Departure Time: ${plan.recommendedDepartureTime}`);
  console.log(`Minutes Until Departure: ${plan.minutesUntilDeparture} mins`);
  console.log(`Recommended Lot: ${plan.recommendedLot?.facility.name}`);
  console.log(`Walking Time to Class: ${plan.recommendedLot?.walkingTimeMinutes} mins`);
  console.log(`Buffer Time Allotted: ${plan.bufferMinutes} mins`);
  console.log(`Alert Status: ${plan.alertBanner}`);
} else {
  console.log('No upcoming classes found.');
}

console.log('\n✅ Schedule module debugging completed successfully.');
