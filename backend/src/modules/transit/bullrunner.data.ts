import { BullRunnerRoute, BullRunnerStop } from './bullrunner.types';

export const BULL_RUNNER_STOPS: BullRunnerStop[] = [
  {
    id: 'stop-yuengling',
    name: 'Yuengling Center Terminal (Lot 43)',
    coordinates: { latitude: 28.0555, longitude: -82.4030 },
    servicedRoutes: ['Route A', 'Route F']
  },
  {
    id: 'stop-msc',
    name: 'Marshall Student Center Transit Plaza',
    coordinates: { latitude: 28.0645, longitude: -82.4135 },
    servicedRoutes: ['Route A', 'Route B', 'Route C', 'Route D']
  },
  {
    id: 'stop-library',
    name: 'USF Library Loop Stop',
    coordinates: { latitude: 28.0592, longitude: -82.4128 },
    servicedRoutes: ['Route B', 'Route D']
  },
  {
    id: 'stop-crescent',
    name: 'Crescent Hill Stop (Near ISA/BSN)',
    coordinates: { latitude: 28.0610, longitude: -82.4088 },
    servicedRoutes: ['Route A', 'Route D']
  },
  {
    id: 'stop-sycamore',
    name: 'Sycamore North Terminal',
    coordinates: { latitude: 28.0673, longitude: -82.4188 },
    servicedRoutes: ['Route B']
  },
  {
    id: 'stop-beard',
    name: 'Beard Garage / Engineering Stop',
    coordinates: { latitude: 28.0605, longitude: -82.4178 },
    servicedRoutes: ['Route C']
  }
];

export const BULL_RUNNER_ROUTES: BullRunnerRoute[] = [
  {
    id: 'route-a',
    name: 'Route A (Campus Core Loop)',
    colorHex: '#006747', // USF Green
    frequencyMinutes: 7,
    stops: BULL_RUNNER_STOPS.filter((s) => s.servicedRoutes.includes('Route A'))
  },
  {
    id: 'route-b',
    name: 'Route B (North-South Connector)',
    colorHex: '#CFC493', // USF Gold
    frequencyMinutes: 10,
    stops: BULL_RUNNER_STOPS.filter((s) => s.servicedRoutes.includes('Route B'))
  },
  {
    id: 'route-c',
    name: 'Route C (Engineering & Beard Express)',
    colorHex: '#00543D',
    frequencyMinutes: 8,
    stops: BULL_RUNNER_STOPS.filter((s) => s.servicedRoutes.includes('Route C'))
  }
];
