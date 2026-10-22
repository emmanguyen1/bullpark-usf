import express, { Request, Response } from 'express';
import cors from 'cors';
import { campusService } from './modules/campus/campus.service';
import { routingService } from './modules/routing/routing.service';
import { occupancyService } from './modules/occupancy/occupancy.service';
import { weatherService } from './modules/weather-sweat/weather.service';
import { transitService } from './modules/transit/transit.service';
import { scheduleService } from './modules/schedule/schedule.service';
import { exchangeService } from './modules/spot-exchange/exchange.service';
import { PermitType } from './modules/campus/campus.types';
import { authRouter } from './modules/auth/auth.router';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Reject invalid input before it reaches shared simulation state.
app.use('/api', (req, res, next) => {
  const input = req.method === 'GET' ? req.query : (req.body || {});
  const invalid = (message: string) => res.status(400).json({ error: message });
  if (input.permit !== undefined && (typeof input.permit !== 'string' || !['S', 'R', 'E', 'D', 'Y'].includes(input.permit.toUpperCase()))) return invalid('Invalid parking permit.');
  for (const field of ['temp', 'temperatureF', 'percentage', 'departureInMinutes', 'relativeHumidity', 'uvIndex']) {
    if (input[field] !== undefined) {
      const value = input[field];
      const number = typeof value === 'number' ? value : (req.method === 'GET' && typeof value === 'string' && value.trim() ? Number(value) : NaN);
      const [min, max] = field === 'temp' || field === 'temperatureF' ? [-50, 150] : field === 'departureInMinutes' ? [0, 120] : field === 'uvIndex' ? [0, 20] : [0, 100];
      if (!Number.isFinite(number) || number < min || number > max) return invalid(`Invalid ${field}.`);
    }
  }
  if (input.rain !== undefined && input.rain !== 'true' && input.rain !== 'false') return invalid('rain must be true or false.');
  if (input.isRaining !== undefined && typeof input.isRaining !== 'boolean') return invalid('isRaining must be a boolean.');
  for (const field of ['simulatedTime', 'timeString']) {
    if (input[field] != null && (typeof input[field] !== 'string' || !Number.isFinite(new Date(input[field]).getTime()))) return invalid('Invalid simulation date.');
  }
  if (input.facilityId !== undefined && (typeof input.facilityId !== 'string' || !campusService.getFacilityById(input.facilityId))) return invalid('Unknown parking facility.');
  if (req.path === '/occupancy/override-facility' && (!input.facilityId || input.percentage === undefined)) return invalid('facilityId and percentage are required.');
  if (req.path === '/exchange/simulate-bluetooth' && (!input.facilityId || !['CONNECTED', 'DISCONNECTED'].includes(input.eventType))) return invalid('Valid facilityId and eventType are required.');
  if (req.method === 'POST' && req.path === '/exchange/trades') {
    if (!input.facilityId || input.departureInMinutes === undefined) return invalid('facilityId and departureInMinutes are required.');
    for (const field of ['levelOrSection', 'spotDescription', 'reportedBy']) {
      if (typeof input[field] !== 'string' || !input[field].trim() || input[field].length > 300) return invalid(`Invalid ${field}.`);
    }
    req.body.facilityName = campusService.getFacilityById(input.facilityId)!.name;
  }
  if (input.studentName !== undefined && (typeof input.studentName !== 'string' || input.studentName.length > 100)) return invalid('Invalid student name.');
  next();
});

// ----------------------------------------------------
// 1. CAMPUS MODULE ENDPOINTS
// ----------------------------------------------------
app.get('/api/campus/buildings', (_req: Request, res: Response) => {
  res.json({ buildings: campusService.getAllBuildings() });
});

app.get('/api/campus/facilities', (_req: Request, res: Response) => {
  res.json({ facilities: campusService.getAllFacilities() });
});

// ----------------------------------------------------
// 2. ROUTING MODULE ENDPOINTS
// ----------------------------------------------------
app.get('/api/routing/recommend', (req: Request, res: Response) => {
  try {
    const destinationBuildingId = (req.query.destination as string) || 'BSN';
    const userPermit = ((req.query.permit as string) || 'S').toUpperCase() as PermitType;
    const tempF = req.query.temp ? parseFloat(req.query.temp as string) : undefined;
    const isRaining = req.query.rain !== undefined ? req.query.rain === 'true' : undefined;

    // Optional simulated time parameter (e.g. "17:45" or ISO string)
    let currentTime: Date | undefined;
    if (req.query.simulatedTime) {
      currentTime = new Date(req.query.simulatedTime as string);
    }

    const result = routingService.findBestParkingOptions({
      destinationBuildingId,
      userPermit,
      currentTime,
      currentTemperatureF: tempF,
      isRaining
    });

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 3. OCCUPANCY MODULE ENDPOINTS
// ----------------------------------------------------
app.get('/api/occupancy', (_req: Request, res: Response) => {
  res.json({
    effectiveTime: occupancyService.getEffectiveTime().toLocaleTimeString(),
    facilities: occupancyService.getAllOccupancies()
  });
});

app.post('/api/occupancy/simulate-time', (req: Request, res: Response) => {
  const { timeString } = req.body;
  if (!timeString) {
    occupancyService.setSimulatedTime(null);
    return res.json({ message: 'Simulated time cleared. Using real clock.', time: new Date() });
  }
  const parsed = new Date(timeString);
  occupancyService.setSimulatedTime(parsed);
  return res.json({ message: 'Simulated time set.', time: parsed });
});

app.post('/api/occupancy/override-facility', (req: Request, res: Response) => {
  const { facilityId, percentage } = req.body;
  occupancyService.setFacilityOccupancyOverride(facilityId, percentage);
  res.json({ message: `Facility ${facilityId} override set to ${percentage}%` });
});

// ----------------------------------------------------
// 4. WEATHER & SWEAT MODULE ENDPOINTS
// ----------------------------------------------------
app.get('/api/weather', (_req: Request, res: Response) => {
  res.json({ weather: weatherService.getCurrentWeather() });
});

app.post('/api/weather/live', async (_req: Request, res: Response) => {
  const updated = await weatherService.refreshLiveWeather();
  res.json({ weather: updated });
});

app.post('/api/weather/override', (req: Request, res: Response) => {
  const updated = weatherService.setWeatherOverride(req.body);
  res.json({ weather: updated });
});

// ----------------------------------------------------
// 5. TRANSIT MODULE ENDPOINTS
// ----------------------------------------------------
app.get('/api/transit/routes', (_req: Request, res: Response) => {
  res.json({
    routes: transitService.getAllRoutes(),
    stops: transitService.getAllStops()
  });
});

app.get('/api/transit/fallback', (req: Request, res: Response) => {
  const bldgCode = (req.query.building as string) || 'BSN';
  const bldg = campusService.getBuildingById(bldgCode);
  if (!bldg) {
    return res.status(404).json({ error: 'Building not found' });
  }
  const fallback = transitService.getMultimodalOptionForBuilding(bldg);
  return res.json({ fallback });
});

// ----------------------------------------------------
// 6. SCHEDULE & PERSONALIZED COMMUTE ENDPOINTS
// ----------------------------------------------------
app.get('/api/schedule', (_req: Request, res: Response) => {
  res.json({ schedule: scheduleService.getSchedule() });
});

app.get('/api/schedule/presets', (_req: Request, res: Response) => {
  res.json({ presets: scheduleService.getPresets() });
});

app.get('/api/schedule/preferences', (_req: Request, res: Response) => {
  res.json({ preferences: scheduleService.getPreferences() });
});

app.post('/api/schedule/preferences', (req: Request, res: Response) => {
  const updated = scheduleService.setPreferences(req.body);
  res.json({ preferences: updated });
});

app.post('/api/schedule/upload', async (req: Request, res: Response) => {
  const { fileContent, fileBase64, fileName, fileType } = req.body;
  if (!fileContent && !fileBase64) {
    return res.status(400).json({ error: 'fileContent or fileBase64 is required' });
  }
  const result = await scheduleService.parseUpload({ fileContent, fileBase64, fileName, fileType });
  return res.json({
    schedule: result.courses,
    format: result.format,
    message: `Imported ${result.courses.length} classes from ${result.format.toUpperCase()} schedule.`
  });
});

app.post('/api/schedule/sync', async (req: Request, res: Response) => {
  const { presetKey, icsContent, csvContent, fileContent, fileBase64, fileName, classes } = req.body;
  if (presetKey) {
    const updated = scheduleService.resetSchedule(presetKey);
    return res.json({ schedule: updated, message: `Synced with ${presetKey} preset.` });
  }
  if (fileContent || fileBase64) {
    const result = await scheduleService.parseUpload({ fileContent, fileBase64, fileName });
    return res.json({ schedule: result.courses, message: `Imported ${result.courses.length} classes.` });
  }
  if (icsContent) {
    const updated = scheduleService.parseICS(icsContent);
    return res.json({ schedule: updated, message: `Imported ${updated.length} classes from calendar.` });
  }
  if (csvContent) {
    const updated = scheduleService.parseCSV(csvContent);
    return res.json({ schedule: updated, message: `Imported ${updated.length} classes from CSV table.` });
  }
  if (Array.isArray(classes)) {
    const updated = scheduleService.setSchedule(classes);
    return res.json({ schedule: updated, message: 'Schedule updated.' });
  }
  return res.status(400).json({ error: 'Provide presetKey, icsContent, csvContent, fileContent, or classes array.' });
});

app.post('/api/schedule/courses', (req: Request, res: Response) => {
  const newCourse = scheduleService.addClass(req.body);
  res.status(201).json({ course: newCourse, schedule: scheduleService.getSchedule() });
});

app.delete('/api/schedule/courses/:id', (req: Request, res: Response) => {
  const courseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const removed = scheduleService.removeClass(courseId);
  res.json({ success: removed, schedule: scheduleService.getSchedule() });
});

app.post('/api/schedule/reset', (req: Request, res: Response) => {
  const { presetKey } = req.body;
  const updated = scheduleService.resetSchedule(presetKey || 'business_finance');
  res.json({ schedule: updated });
});

app.get('/api/schedule/next-departure', (req: Request, res: Response) => {
  const permit = ((req.query.permit as string) || 'S').toUpperCase() as PermitType;
  const bufferMinutes = req.query.bufferMinutes ? parseInt(req.query.bufferMinutes as string, 10) : undefined;
  const walkingPace = (req.query.walkingPace as 'casual' | 'normal' | 'brisk') || undefined;
  const commuteDriveMinutes = req.query.commuteDriveMinutes ? parseInt(req.query.commuteDriveMinutes as string, 10) : undefined;
  const departureOriginName = (req.query.originName as string) || undefined;

  const override: any = {};
  if (bufferMinutes !== undefined && !isNaN(bufferMinutes)) override.targetArrivalBufferMinutes = bufferMinutes;
  if (walkingPace) override.walkingPace = walkingPace;
  if (commuteDriveMinutes !== undefined && !isNaN(commuteDriveMinutes)) override.commuteDriveMinutes = commuteDriveMinutes;
  if (departureOriginName) override.departureOriginName = departureOriginName;

  const plan = scheduleService.getNextDeparturePlan(permit, override);
  res.json({ plan });
});

// ----------------------------------------------------
// 7. SPOT EXCHANGE & TELEMETRY MODULE ENDPOINTS
// ----------------------------------------------------
app.get('/api/exchange/trades', (_req: Request, res: Response) => {
  res.json({ trades: exchangeService.getActiveTrades() });
});

app.post('/api/exchange/trades', (req: Request, res: Response) => {
  const created = exchangeService.broadcastDeparture(req.body);
  res.status(201).json({ trade: created });
});

app.post('/api/exchange/trades/:id/claim', (req: Request, res: Response) => {
  const { studentName } = req.body;
  const tradeId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const claimed = exchangeService.claimSpot(tradeId, studentName || 'Bull Commuter');
  if (!claimed) {
    return res.status(404).json({ error: 'Spot trade not available or already claimed' });
  }
  return res.json({ trade: claimed });
});

app.post('/api/exchange/simulate-bluetooth', (req: Request, res: Response) => {
  const { eventType, facilityId } = req.body;
  const event = exchangeService.simulateBluetoothSignal(eventType, facilityId);
  res.json({ event });
});

app.get('/api/exchange/telemetry', (_req: Request, res: Response) => {
  res.json({ recentEvents: exchangeService.getRecentTelemetry() });
});

// ----------------------------------------------------
// 8. USER AUTH & PERSONALIZATION MODULE ENDPOINTS
// ----------------------------------------------------
app.use('/api/auth', authRouter);

// Start Express Server
app.listen(PORT, () => {
  console.log(`🟢 BullPark Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 Ready with modular USF intelligence endpoints.`);
});
