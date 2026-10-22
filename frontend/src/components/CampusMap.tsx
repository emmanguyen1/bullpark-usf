import { useEffect, useRef, useState, type ComponentProps } from 'react';
import {
  LocateFixed,
  MapPin,
  Navigation,
  Footprints,
  X,
  Car,
  Search,
  Compass
} from 'lucide-react';
import type { USFMap } from './USFMap';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getRoute } from '../lib/openRouting';

const CAMPUS_BOUNDS: L.LatLngBoundsExpression = [
  [28.052, -82.424],
  [28.070, -82.400]
];

const point = (p: { latitude: number; longitude: number }) => ({
  lat: p.latitude,
  lng: p.longitude
});

type Destination = { position: L.LatLngLiteral; name: string };

const MAP_LAYERS = {
  google_roadmap: {
    label: 'Google Roadmap',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps'
  },
  google_satellite: {
    label: 'Google Satellite',
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps'
  },
  google_hybrid: {
    label: 'Google Hybrid',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps'
  },
  osm: {
    label: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: '&copy; OpenStreetMap contributors'
  }
};

export function CampusMap(props: ComponentProps<typeof USFMap>) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const tileLayer = useRef<L.TileLayer | null>(null);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [activeLayerKey, setActiveLayerKey] = useState<keyof typeof MAP_LAYERS>('google_roadmap');
  const [locationError, setLocationError] = useState('');
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState<L.LatLngLiteral | null>(null);
  const [accuracy, setAccuracy] = useState(0);
  const watch = useRef<number | null>(null);
  const [pin, setPin] = useState<Destination | null>(null);
  const [walking, setWalking] = useState(false);
  const [travelMode, setTravelMode] = useState<'WALKING' | 'DRIVING'>('WALKING');
  const [buildingSearch, setBuildingSearch] = useState('');
  const [routeDetails, setRouteDetails] = useState<{ summary: string; steps: string[] } | null>(null);
  const [routeStatus, setRouteStatus] = useState('');
  const [requestedOrigin, setRequestedOrigin] = useState<L.LatLngLiteral | null>(null);
  const [routeAttempt, setRouteAttempt] = useState(0);

  // Layer toggles
  const [showGarages, setShowGarages] = useState(true);
  const [showSurfaceLots, setShowSurfaceLots] = useState(true);
  const [showTransit, setShowTransit] = useState(true);

  const selectedRoute = props.activeRouteOption || props.recommendedOption;
  const destination: Destination | null =
    pin ||
    (props.selectedBuilding
      ? { position: point(props.selectedBuilding.coordinates), name: props.selectedBuilding.name }
      : null);
  const origin = location || (selectedRoute ? point(selectedRoute.facility.coordinates) : null);
  const routeTarget =
    travelMode === 'DRIVING' && selectedRoute
      ? point(selectedRoute.facility.coordinates)
      : destination?.position;
  const targetLat = routeTarget?.lat;
  const targetLng = routeTarget?.lng;
  const originLat = requestedOrigin?.lat;
  const originLng = requestedOrigin?.lng;

  // Initialize Map
  useEffect(() => {
    if (!host.current) return;
    const campusMap = L.map(host.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      center: [28.0594, -82.4130],
      zoom: 16
    }).fitBounds(CAMPUS_BOUNDS, { padding: [24, 24] });

    map.current = campusMap;

    const layerConfig = MAP_LAYERS[activeLayerKey];
    const tiles = L.tileLayer(layerConfig.url, {
      maxZoom: 20,
      subdomains: layerConfig.subdomains,
      attribution: layerConfig.attribution
    }).addTo(campusMap);

    tileLayer.current = tiles;

    tiles.on('tileerror', () => setError('Some map tiles could not load.'));
    tiles.on('load', () => setError(''));

    campusMap.on('click', (event: L.LeafletMouseEvent) => {
      setPin({
        position: { lat: event.latlng.lat, lng: event.latlng.lng },
        name: 'Selected Pin'
      });
      setWalking(false);
    });

    const observer = new ResizeObserver(() => campusMap.invalidateSize());
    observer.observe(host.current);
    setReady(true);

    return () => {
      observer.disconnect();
      campusMap.remove();
      map.current = null;
    };
  }, []);

  // Update Tile Layer URL when user toggles Roadmap / Satellite / Hybrid
  useEffect(() => {
    if (!tileLayer.current) return;
    const layerConfig = MAP_LAYERS[activeLayerKey];
    tileLayer.current.setUrl(layerConfig.url);
  }, [activeLayerKey]);

  useEffect(() => {
    setPin(null);
    setWalking(false);
    setRouteDetails(null);
    if (props.selectedBuilding && map.current) {
      map.current.panTo(point(props.selectedBuilding.coordinates));
    }
  }, [props.selectedBuilding?.id]);

  useEffect(() => () => {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
  }, []);

  // Render Markers (All 26 USF buildings, 9 facilities, transit routes, and active walking line)
  useEffect(() => {
    if (!ready || !map.current) return;
    const markers = L.layerGroup().addTo(map.current);

    // 1. Bull Runner Shuttle Routes (Route A, Route B, Route C)
    if (showTransit) {
      const shuttleLines: { name: string; color: string; coords: L.LatLngTuple[] }[] = [
        {
          name: 'Route A (Core Loop)',
          color: '#006747',
          coords: [
            [28.0555, -82.4030],
            [28.0580, -82.4080],
            [28.0610, -82.4088],
            [28.0645, -82.4135],
            [28.0630, -82.4160],
            [28.0592, -82.4128],
            [28.0555, -82.4030]
          ]
        },
        {
          name: 'Route B (North-South)',
          color: '#b59d57',
          coords: [
            [28.0673, -82.4188],
            [28.0645, -82.4135],
            [28.0592, -82.4128],
            [28.0570, -82.4100],
            [28.0592, -82.4128],
            [28.0645, -82.4135],
            [28.0673, -82.4188]
          ]
        },
        {
          name: 'Route C (Engineering Express)',
          color: '#0d9488',
          coords: [
            [28.0605, -82.4178],
            [28.0597, -82.4169],
            [28.0645, -82.4135],
            [28.0605, -82.4178]
          ]
        }
      ];

      shuttleLines.forEach((route) => {
        const poly = L.polyline(route.coords, {
          color: route.color,
          weight: 3.5,
          dashArray: '6, 6',
          opacity: 0.8
        });
        poly.bindTooltip(route.name);
        poly.addTo(markers);
      });
    }

    // 2. Parking Facilities Markers
    for (const facility of props.facilities) {
      const isGarage = facility.type === 'garage';
      if (isGarage && !showGarages) continue;
      if (!isGarage && !showSurfaceLots) continue;

      const route = props.rankedOptions.find((r) => r.facility.id === facility.id);
      const isSelected = selectedRoute?.facility.id === facility.id;
      const isRecommended = props.recommendedOption?.facility.id === facility.id;

      let statusColor = '#059669'; // Open
      if (!route || !route.isLegal) statusColor = '#64748b'; // Citation risk / restricted
      else if (route.currentOccupancyPercentage >= 90) statusColor = '#dc2626'; // Red full
      else if (route.currentOccupancyPercentage >= 75) statusColor = '#d97706'; // Amber

      const shortName = facility.name.split('(')[0].replace('Richard A. ', '').trim();
      const capText = route ? `${route.currentOccupancyPercentage}%` : `${facility.totalCapacity}`;

      const content = document.createElement('div');
      content.style.cursor = 'pointer';
      content.style.textAlign = 'center';
      content.innerHTML = `
        <div style="
          width: ${isGarage ? '34px' : '26px'};
          height: ${isGarage ? '34px' : '26px'};
          background: #ffffff;
          border: 3px solid ${isSelected ? '#006747' : isRecommended ? '#cfc493' : statusColor};
          border-radius: ${isGarage ? '8px' : '9999px'};
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: ${isGarage ? '13px' : '11px'};
          color: ${statusColor};
          box-shadow: 0 3px 6px rgba(0,0,0,0.2);
          margin: 0 auto;
        ">
          ${isGarage ? 'G' : 'P'}
        </div>
        <div style="
          background: #ffffff;
          border: 1px solid ${statusColor};
          color: ${statusColor};
          padding: 1px 4px;
          border-radius: 9999px;
          font-weight: 800;
          font-size: 9px;
          margin-top: 2px;
          white-space: nowrap;
          display: inline-block;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        ">
          ${capText}
        </div>
        <div style="font-size: 9px; font-weight: 700; color: #0f172a; background: rgba(255,255,255,0.9); padding: 0 3px; border-radius: 3px; margin-top: 1px; white-space: nowrap; display: inline-block;">
          ${shortName}
        </div>
      `;

      const marker = L.marker(point(facility.coordinates), {
        title: `${facility.name} (${capText} occupied)`,
        keyboard: true,
        icon: L.divIcon({ html: content, className: 'campus-leaflet-pin', iconSize: [70, 48], iconAnchor: [35, 24] }),
        zIndexOffset: isSelected || isRecommended ? 800 : 300
      }).addTo(markers);

      marker.on('click', () => {
        props.onSelectFacility(facility);
        setPin({ position: point(facility.coordinates), name: facility.name });
        setWalking(false);
      });
    }

    // 3. All 26 USF Campus Buildings Markers
    for (const building of props.buildings) {
      const isSelected = !pin && props.selectedBuilding?.id === building.id;

      const content = document.createElement('div');
      content.style.cursor = 'pointer';
      content.style.textAlign = 'center';
      content.innerHTML = `
        <div style="
          background: ${isSelected ? '#006747' : '#ffffff'};
          border: 2px solid ${isSelected ? '#cfc493' : '#64748b'};
          color: ${isSelected ? '#ffffff' : '#006747'};
          padding: 2px 6px;
          border-radius: 6px;
          font-weight: 900;
          font-size: 11px;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          display: inline-block;
        ">
          ${building.code}
        </div>
        <div style="font-size: 9px; font-weight: 600; color: ${isSelected ? '#006747' : '#475569'}; background: rgba(255,255,255,0.92); padding: 0 3px; border-radius: 3px; margin-top: 1px; white-space: nowrap; display: inline-block;">
          ${building.name.length > 18 ? building.name.slice(0, 16) + '..' : building.name}
        </div>
      `;

      const marker = L.marker(point(building.coordinates), {
        title: `${building.code}: ${building.name}`,
        keyboard: true,
        icon: L.divIcon({ html: content, className: 'campus-leaflet-pin', iconSize: [64, 32], iconAnchor: [32, 16] }),
        zIndexOffset: isSelected ? 900 : 200
      }).addTo(markers);

      marker.on('click', () => {
        props.onSelectBuilding(building);
        setPin(null);
        setWalking(false);
        map.current?.panTo(point(building.coordinates));
      });
    }

    // Destination Pin
    if (pin) {
      const pinContent = document.createElement('div');
      pinContent.className = 'campus-map-marker';
      pinContent.textContent = 'Pin';
      pinContent.style.background = '#006747';
      L.marker(pin.position, {
        title: pin.name,
        icon: L.divIcon({ html: pinContent, className: 'campus-leaflet-pin', iconSize: [42, 32], iconAnchor: [21, 16] }),
        zIndexOffset: 1000
      }).addTo(markers);
    }

    // User Location
    if (location) {
      const youContent = document.createElement('div');
      youContent.className = 'campus-map-marker';
      youContent.textContent = 'You';
      youContent.style.background = '#2563eb';
      L.marker(location, {
        title: `Your location, accuracy about ${Math.round(accuracy)}m`,
        icon: L.divIcon({ html: youContent, className: 'campus-leaflet-pin', iconSize: [42, 32], iconAnchor: [21, 16] }),
        zIndexOffset: 1200
      }).addTo(markers);
    }

    // Pinned Car
    if (props.pinnedCarLotId) {
      const car = props.facilities.find((f) => f.id === props.pinnedCarLotId);
      if (car) {
        const carContent = document.createElement('div');
        carContent.className = 'campus-map-marker';
        carContent.textContent = 'Car';
        carContent.style.background = '#059669';
        L.marker(point(car.coordinates), {
          title: `Parked Car: ${car.name}`,
          icon: L.divIcon({ html: carContent, className: 'campus-leaflet-pin', iconSize: [42, 32], iconAnchor: [21, 16] }),
          zIndexOffset: 1100
        }).addTo(markers);
      }
    }

    return () => {
      markers.remove();
    };
  }, [
    ready,
    props.facilities,
    selectedRoute?.facility.id,
    destination?.position.lat,
    destination?.position.lng,
    destination?.name,
    props.buildings,
    props.selectedBuilding?.id,
    location,
    props.pinnedCarLotId,
    accuracy,
    showGarages,
    showSurfaceLots,
    showTransit,
    activeLayerKey
  ]);

  // Turn-by-Turn Routing Engine (Walking & Driving)
  useEffect(() => {
    if (!ready || !walking || originLat === undefined || originLng === undefined || targetLat === undefined || targetLng === undefined) return;
    const controller = new AbortController();
    let line: L.Polyline | undefined;
    setRouteDetails(null);
    setRouteStatus(travelMode === 'WALKING' ? 'Finding walking route…' : 'Finding driving route…');

    getRoute({ lat: originLat, lng: originLng }, { lat: targetLat, lng: targetLng }, travelMode, controller.signal)
      .then((route) => {
        if (controller.signal.aborted || !map.current) return;
        line = L.polyline(route.coordinates, { color: '#006747', weight: 6, opacity: 0.9 }).addTo(map.current);
        map.current.fitBounds(line.getBounds(), { padding: [40, 40] });
        setRouteDetails({
          summary: `${travelMode === 'WALKING' ? 'Walk' : 'Drive'} · ${Math.max(1, Math.round(route.duration / 60))} min · ${(route.distance / 1000).toFixed(1)} km`,
          steps: route.steps
        });
        setRouteStatus('Route active. Follow marked pathways.');
      })
      .catch(() => {
        if (!controller.signal.aborted) setRouteStatus('Directions are unavailable right now. Please try again.');
      });

    return () => {
      controller.abort();
      line?.remove();
    };
  }, [ready, walking, travelMode, originLat, originLng, targetLat, targetLng, routeAttempt]);

  const locate = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Location is unavailable in this browser.');
      return;
    }
    setLocating(true);
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
    let centered = false;
    watch.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const position = { lat: coords.latitude, lng: coords.longitude };
        setLocation(position);
        setAccuracy(coords.accuracy);
        setLocating(false);
        if (!centered) {
          map.current?.panTo(position);
          map.current?.setZoom(17);
          centered = true;
        }
      },
      (failure) => {
        setLocating(false);
        setLocationError(
          failure.code === 1
            ? 'Location access was denied. Please allow location access in your browser settings.'
            : 'Could not acquire your location.'
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const matchingBuildings = props.buildings.filter((building) =>
    `${building.code} ${building.name}`.toLowerCase().includes(buildingSearch.toLowerCase())
  );

  const showWalk = () => {
    setRequestedOrigin(origin);
    setTravelMode('WALKING');
    setWalking(true);
    setRouteAttempt((attempt) => attempt + 1);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs" aria-label="Interactive campus navigation">
      {/* Top Header & Layer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 border-b border-slate-200 bg-slate-50">
        <div>
          <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
            <Compass size={15} className="text-[#006747]" />
            <span>USF Tampa Campus Map</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tap any building to select your destination or view nearby parking.
          </p>
        </div>

        {/* Map Type & Control Buttons */}
        <div className="flex items-center gap-1.5 text-xs font-bold flex-wrap">
          {/* Map Tile Switcher */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs">
            <button
              onClick={() => setActiveLayerKey('google_roadmap')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeLayerKey === 'google_roadmap'
                  ? 'bg-[#006747] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Roadmap
            </button>
            <button
              onClick={() => setActiveLayerKey('google_hybrid')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeLayerKey === 'google_hybrid'
                  ? 'bg-[#006747] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satellite
            </button>
          </div>

          {/* Visibility Toggles */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs text-[11px]">
            <button
              type="button"
              onClick={() => setShowGarages(!showGarages)}
              className={`px-2 py-1 rounded-lg transition-all ${
                showGarages
                  ? 'bg-emerald-50 text-[#006747] font-black border border-emerald-200'
                  : 'text-slate-400 font-semibold line-through'
              }`}
            >
              Garages
            </button>
            <button
              type="button"
              onClick={() => setShowSurfaceLots(!showSurfaceLots)}
              className={`px-2 py-1 rounded-lg transition-all ${
                showSurfaceLots
                  ? 'bg-emerald-50 text-[#006747] font-black border border-emerald-200'
                  : 'text-slate-400 font-semibold line-through'
              }`}
            >
              Lots
            </button>
            <button
              type="button"
              onClick={() => setShowTransit(!showTransit)}
              className={`px-2 py-1 rounded-lg transition-all ${
                showTransit
                  ? 'bg-emerald-50 text-[#006747] font-black border border-emerald-200'
                  : 'text-slate-400 font-semibold line-through'
              }`}
            >
              Shuttles
            </button>
          </div>

          <button
            disabled={!ready}
            className="map-action text-xs"
            onClick={() => map.current?.fitBounds(CAMPUS_BOUNDS, { padding: [24, 24] })}
          >
            Full campus
          </button>

          <button
            disabled={!ready || locating}
            className="map-action text-xs"
            onClick={locate}
          >
            <LocateFixed size={13} />
            <span>{locating ? 'Locating…' : 'My location'}</span>
          </button>
        </div>
      </div>

      {/* Campus Building Search Input */}
      <div className="p-3 border-b border-slate-200 bg-white">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-3 text-slate-400" />
          <input
            id="map-building-search"
            value={buildingSearch}
            onChange={(event) => setBuildingSearch(event.target.value)}
            placeholder="Search campus buildings by code or department (e.g. BSN, ENG, ISA, JPN, LIB)..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-[#006747] focus:bg-white transition-colors"
          />
        </div>

        {buildingSearch.trim() && (
          <ul className="max-h-48 overflow-y-auto mt-2 text-xs rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-sm" aria-label="Matching campus buildings">
            {matchingBuildings.map((building) => (
              <li key={building.id}>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center justify-between transition-colors"
                  onClick={() => {
                    props.onSelectBuilding(building);
                    setPin(null);
                    setWalking(false);
                    setBuildingSearch('');
                    map.current?.panTo(point(building.coordinates));
                    map.current?.setZoom(17);
                  }}
                >
                  <span className="font-bold text-slate-900">
                    <span className="text-[#006747] font-black mr-1.5">[{building.code}]</span>
                    {building.name}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">{building.category}</span>
                </button>
              </li>
            ))}
            {!matchingBuildings.length && (
              <li className="px-3 py-2.5 text-slate-500 text-center">No matching campus building found.</li>
            )}
          </ul>
        )}
      </div>

      {/* Map Render Container */}
      <div className="relative">
        <div ref={host} className="h-[480px] sm:h-[580px] w-full z-0" aria-label="Interactive campus map" />
        {error && (
          <p role="status" className="absolute top-3 left-12 right-3 z-[500] rounded-xl bg-white p-3 text-xs shadow-md border border-slate-200 text-slate-600 font-medium">
            {error}
          </p>
        )}
      </div>

      {/* Navigation Controls & Status Footer */}
      <div className="p-3.5 space-y-3 bg-white border-t border-slate-200">
        {locationError && <p role="alert" className="text-xs text-rose-700 font-medium">{locationError}</p>}

        {location && (
          <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500 font-medium">
            <span>Location active · Accuracy ~{Math.round(accuracy)}m</span>
            <button
              className="text-[#006747] font-bold hover:underline"
              onClick={() => {
                if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
                watch.current = null;
                setLocation(null);
                setWalking(false);
              }}
            >
              Stop sharing location
            </button>
          </div>
        )}

        {destination && (
          <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-[#006747] border border-emerald-200">
                <MapPin size={16} />
              </span>
              <div>
                <p className="font-extrabold text-xs text-slate-900">{destination.name}</p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Routing from {location ? 'current location' : selectedRoute?.facility.name || 'nearest lot'}
                </p>
              </div>
              {pin && (
                <button
                  aria-label="Clear destination pin"
                  className="p-1 text-slate-400 hover:text-slate-700"
                  onClick={() => {
                    setPin(null);
                    setWalking(false);
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <button
                className="map-action"
                disabled={!ready || !origin}
                onClick={showWalk}
              >
                <Footprints size={14} />
                <span>Walk here</span>
              </button>
            </div>
          </div>
        )}

        {walking && (
          <div className="rounded-2xl border border-slate-200 p-3.5 space-y-2 bg-slate-50">
            <div className="flex items-center justify-between">
              <p role="status" className="text-xs text-slate-700 font-semibold">{routeStatus}</p>
              <button
                aria-label="Close directions"
                className="p-1 text-slate-400 hover:text-slate-700"
                onClick={() => {
                  setWalking(false);
                  setRouteDetails(null);
                }}
              >
                <X size={14} />
              </button>
            </div>
            {routeDetails && (
              <>
                <h3 className="font-extrabold text-xs text-[#006747]">{routeDetails.summary}</h3>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-700 max-h-48 overflow-y-auto">
                  {routeDetails.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </>
            )}
          </div>
        )}

        {selectedRoute && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                disabled={!ready || !location}
                onClick={() => {
                  setRequestedOrigin(location);
                  setTravelMode('DRIVING');
                  setWalking(true);
                  setRouteAttempt((attempt) => attempt + 1);
                }}
                className="map-action font-bold"
              >
                <Navigation size={13} />
                <span>Drive to parking</span>
              </button>
              {!location && (
                <span className="text-[11px] text-slate-400 font-medium">
                  (Turn on My location for turn-by-turn driving)
                </span>
              )}
            </div>

            <button
              onClick={() => props.onPinCar?.(selectedRoute.facility.id)}
              className="text-xs font-bold text-[#006747] hover:underline flex items-center gap-1"
            >
              <Car size={13} />
              <span>Save my parked car</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
