interface Position { lat: number; lng: number }
interface RoutingResponse {
  code: string;
  routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] }; legs: { steps: { distance: number; name: string; maneuver: { type: string; modifier?: string; exit?: number } }[] }[] }[];
}
let nextRequest = 0;

/** Explicit requests only; public demo service permits at most one request per second. */
export async function getRoute(origin: Position, destination: Position, mode: 'WALKING' | 'DRIVING', signal: AbortSignal) {
  const scheduled = Math.max(Date.now(), nextRequest);
  nextRequest = scheduled + 1100;
  await new Promise<void>((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
    const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
    const timer = window.setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, scheduled - Date.now());
    signal.addEventListener('abort', abort, { once: true });
  });
  const base = mode === 'WALKING'
    ? import.meta.env.VITE_WALK_ROUTING_URL || 'https://routing.openstreetmap.de/routed-foot'
    : import.meta.env.VITE_DRIVE_ROUTING_URL || 'https://routing.openstreetmap.de/routed-car';
  const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const response = await fetch(`${base}/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true&generate_hints=false`, { signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]) });
  if (!response.ok) throw new Error('Routing service unavailable');
  const result: RoutingResponse = await response.json();
  const route = result.routes?.[0];
  if (result.code !== 'Ok' || !route || route.geometry.coordinates.length < 2) throw new Error('No route found');
  return {
    distance: route.distance, duration: route.duration,
    coordinates: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
    steps: route.legs.flatMap(leg => leg.steps.map(step => {
      const maneuver = step.maneuver;
      const action = maneuver.type === 'arrive' ? 'Arrive at your destination' : maneuver.type === 'depart' ? 'Start' : maneuver.type.includes('roundabout') ? `Take the roundabout${maneuver.exit ? `, exit ${maneuver.exit}` : ''}` : `${maneuver.type.replaceAll('_', ' ')}${maneuver.modifier ? ` ${maneuver.modifier}` : ''}`;
      return `${action.charAt(0).toUpperCase()}${action.slice(1)}${step.name ? ` on ${step.name}` : ''}${step.distance ? ` · ${Math.round(step.distance)} m` : ''}`;
    }))
  };
}
