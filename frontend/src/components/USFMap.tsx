import React, { useState } from 'react';
import {
  Building,
  ParkingFacility,
  RouteOption,
  BullRunnerRoute,
  BullRunnerStop,
  BullTradeSpot
} from '../types/campus';
import {
  Car,
  Compass,
  MapPin,
  Navigation,
  Radio,
  Warehouse,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Layers
} from 'lucide-react';

interface USFMapProps {
  buildings: Building[];
  facilities: ParkingFacility[];
  selectedBuilding: Building | null;
  recommendedOption: RouteOption | null;
  activeRouteOption: RouteOption | null;
  onSelectBuilding: (building: Building) => void;
  onSelectFacility: (facility: ParkingFacility) => void;
  rankedOptions: RouteOption[];
  bullRunnerRoutes?: BullRunnerRoute[];
  bullRunnerStops?: BullRunnerStop[];
  activeTrades?: BullTradeSpot[];
  pinnedCarLotId?: string | null;
  onPinCar?: (facilityId: string) => void;
  onClaimSpot?: (tradeId: string) => void;
}

export const USFMap: React.FC<USFMapProps> = ({
  buildings,
  facilities,
  selectedBuilding,
  recommendedOption,
  activeRouteOption,
  onSelectBuilding,
  onSelectFacility,
  rankedOptions,
  activeTrades = [],
  pinnedCarLotId,
  onPinCar,
  onClaimSpot
}) => {
  // Layer visibility controls
  const [showGarages, setShowGarages] = useState(true);
  const [showSurfaceLots, setShowSurfaceLots] = useState(true);
  const [showBullTrades, setShowBullTrades] = useState(true);
  const [activeZone, setActiveZone] = useState<'all' | 'core' | 'north' | 'south'>('all');

  // Inspection tooltip modal state
  const [inspectedEntity, setInspectedEntity] = useState<{
    type: 'facility' | 'building' | 'stop' | 'trade';
    data: any;
  } | null>(null);

  // SVG Canvas dimensions: 1000 x 700
  const width = 1000;
  const height = 700;

  // Geographic bounds of USF Tampa Campus
  const baseBounds = {
    minLat: 28.0535,
    maxLat: 28.0695,
    minLon: -82.4225,
    maxLon: -82.4005
  };

  // Preset zone views
  const zoneBounds = {
    all: baseBounds,
    core: { minLat: 28.0570, maxLat: 28.0660, minLon: -82.4170, maxLon: -82.4070 },
    north: { minLat: 28.0610, maxLat: 28.0690, minLon: -82.4210, maxLon: -82.4080 },
    south: { minLat: 28.0535, maxLat: 28.0620, minLon: -82.4160, maxLon: -82.4010 }
  };

  const currentBounds = zoneBounds[activeZone];

  const projectToSvg = (lat: number, lon: number) => {
    const padX = 50;
    const padY = 50;
    const x = ((lon - currentBounds.minLon) / (currentBounds.maxLon - currentBounds.minLon)) * (width - 2 * padX) + padX;
    const y = ((currentBounds.maxLat - lat) / (currentBounds.maxLat - currentBounds.minLat)) * (height - 2 * padY) + padY;
    return { x, y };
  };

  // Find facility route info for color coding & metrics
  const getFacilityRoute = (facilityId: string) => {
    return rankedOptions.find((r) => r.facility.id === facilityId);
  };

  const getOccupancyColor = (route?: RouteOption) => {
    if (!route || !route.isLegal) return '#64748b'; // Prohibited gray
    const pct = route.currentOccupancyPercentage;
    if (pct >= 90) return '#dc2626'; // Red congested
    if (pct >= 75) return '#d97706'; // Amber busy
    return '#059669'; // Emerald open
  };

  // Active route option to display walking path (active or recommended)
  const displayRouteOption = activeRouteOption || recommendedOption;

  // Walking path calculations
  let walkingPathElement = null;
  if (displayRouteOption && selectedBuilding) {
    const start = projectToSvg(
      displayRouteOption.facility.coordinates.latitude,
      displayRouteOption.facility.coordinates.longitude
    );
    const end = projectToSvg(
      selectedBuilding.coordinates.latitude,
      selectedBuilding.coordinates.longitude
    );

    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const bendX = start.x;
    const bendY = end.y;

    walkingPathElement = (
      <g className="walking-route-group">
        {/* Glow halo */}
        <path
          d={`M ${start.x} ${start.y} Q ${bendX} ${bendY} ${end.x} ${end.y}`}
          fill="none"
          stroke="#006747"
          strokeWidth="7"
          strokeOpacity="0.18"
          strokeLinecap="round"
        />
        {/* Main walking line */}
        <path
          d={`M ${start.x} ${start.y} Q ${bendX} ${bendY} ${end.x} ${end.y}`}
          fill="none"
          stroke="#006747"
          strokeWidth="3.5"
          strokeDasharray="8,6"
          strokeLinecap="round"
          className="animate-pulse"
        />
        {/* Direction marker dots */}
        <circle cx={start.x} cy={start.y} r="6" fill="#006747" stroke="#ffffff" strokeWidth="2" />
        <circle cx={end.x} cy={end.y} r="6" fill="#059669" stroke="#ffffff" strokeWidth="2" />

        {/* Floating Walk Metric Badge */}
        <g transform={`translate(${midX}, ${midY})`}>
          <rect
            x="-80"
            y="-16"
            width="160"
            height="32"
            rx="16"
            fill="#ffffff"
            stroke="#006747"
            strokeWidth="2"
            filter="drop-shadow(0 4px 8px rgba(0,0,0,0.12))"
          />
          <text
            x="0"
            y="5"
            fill="#006747"
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {displayRouteOption.walkingTimeMinutes}m walk · {displayRouteOption.estimatedWalkingDistanceMeters}m
          </text>
        </g>
      </g>
    );
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col">
      {/* Top Map Action Bar */}
      <div className="p-3 bg-white/95 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 z-20">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-black text-[#006747]">
            <Compass size={14} className="text-[#006747]" />
            <span>USF Tampa Campus Map</span>
          </div>

          {/* Quick Zone Focus Tabs */}
          <div className="hidden sm:flex items-center bg-slate-100 rounded-xl p-0.5 text-[11px] border border-slate-200">
            <button
              onClick={() => setActiveZone('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                activeZone === 'all' ? 'bg-[#006747] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Full Campus
            </button>
            <button
              onClick={() => setActiveZone('core')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                activeZone === 'core' ? 'bg-[#006747] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Core (Library/MSC)
            </button>
            <button
              onClick={() => setActiveZone('north')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                activeZone === 'north' ? 'bg-[#006747] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              North STEM
            </button>
            <button
              onClick={() => setActiveZone('south')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                activeZone === 'south' ? 'bg-[#006747] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              South Quad
            </button>
          </div>
        </div>

        {/* Layer Filters */}
        <div className="flex items-center gap-1 text-[11px]">
          <button
            onClick={() => setShowGarages(!showGarages)}
            className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 font-bold transition-all ${
              showGarages
                ? 'bg-emerald-50 border-[#006747] text-[#006747]'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
            title="Toggle Parking Garages"
          >
            <Warehouse size={12} />
            <span>Garages</span>
          </button>

          <button
            onClick={() => setShowSurfaceLots(!showSurfaceLots)}
            className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 font-bold transition-all ${
              showSurfaceLots
                ? 'bg-emerald-50 border-[#006747] text-[#006747]'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
            title="Toggle Surface Lots"
          >
            <span>P</span>
            <span>Lots</span>
          </button>

          <button
            onClick={() => setShowBullTrades(!showBullTrades)}
            className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 font-bold transition-all ${
              showBullTrades
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
            title="Toggle Live Spot Exchanges"
          >
            <Radio size={12} />
            <span className="hidden md:inline">Trades ({activeTrades.length})</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Map (Light Cartography) */}
      <div className="relative w-full overflow-hidden bg-[#f2f6f3]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ minHeight: '520px' }}
        >
          <defs>
            {/* Soft Grid Pattern */}
            <pattern id="campusGridLight" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5ede6" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* Canvas Background */}
          <rect width="100%" height="100%" fill="#f1f5f2" />
          <rect width="100%" height="100%" fill="url(#campusGridLight)" />

          {/* 1. CAMPUS CARTOGRAPHY: LAWNS, QUADS, AND WATER BODIES (LIGHT MODE) */}
          {/* MLK Plaza & Reflecting Pool */}
          <rect x="420" y="310" width="120" height="60" rx="10" fill="#dcfce7" stroke="#bbf7d0" strokeWidth="1.5" />
          <rect x="445" y="330" width="70" height="20" rx="6" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="1.5" />
          <text x="480" y="324" fill="#047857" fontSize="8" fontWeight="bold" textAnchor="middle">MLK PLAZA</text>

          {/* Castor Beach Lawn */}
          <ellipse cx="610" cy="270" rx="60" ry="35" fill="#dcfce7" stroke="#bbf7d0" strokeWidth="1.5" />
          <text x="610" y="273" fill="#047857" fontSize="8" fontWeight="bold" textAnchor="middle">CASTOR LAWN</text>

          {/* Crescent Hill Quad */}
          <ellipse cx="680" cy="220" rx="55" ry="30" fill="#dcfce7" stroke="#bbf7d0" strokeWidth="1.5" />
          <text x="680" y="223" fill="#047857" fontSize="8" fontWeight="bold" textAnchor="middle">CRESCENT HILL</text>

          {/* USF Botanical Gardens & Lake */}
          <path
            d="M 120 450 Q 180 430 200 480 Q 220 540 150 560 Q 90 530 120 450 Z"
            fill="#e0f2fe"
            stroke="#7dd3fc"
            strokeWidth="2"
          />
          <text x="160" y="500" fill="#0369a1" fontSize="9" fontWeight="bold" textAnchor="middle">BOTANICAL GARDENS</text>

          {/* Campus Rec Sports Fields */}
          <rect x="730" y="290" width="160" height="110" rx="12" fill="#dcfce7" stroke="#bbf7d0" strokeWidth="1.5" />
          <text x="810" y="350" fill="#047857" fontSize="9" fontWeight="bold" textAnchor="middle">USF REC FIELDS</text>

          {/* 2. CAMPUS ROAD NETWORK (Clean White Roads with Slate Outlines) */}
          <g strokeLinecap="round" strokeLinejoin="round">
            {/* E Fletcher Ave (North Highway) */}
            <path d="M 40 40 L 960 40" stroke="#e2e8f0" strokeWidth="18" />
            <path d="M 40 40 L 960 40" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="14,14" />
            <text x="120" y="30" fill="#64748b" fontSize="10" fontWeight="bold" letterSpacing="1">E FLETCHER AVE</text>

            {/* E Fowler Ave (South Highway) */}
            <path d="M 40 660 L 960 660" stroke="#e2e8f0" strokeWidth="18" />
            <path d="M 40 660 L 960 660" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="14,14" />
            <text x="120" y="650" fill="#64748b" fontSize="10" fontWeight="bold" letterSpacing="1">E FOWLER AVE</text>

            {/* Internal Campus Boulevards */}
            {/* Leroy Collins Blvd */}
            <path d="M 520 70 L 520 630" stroke="#ffffff" strokeWidth="14" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.06))" />
            <path d="M 520 70 L 520 630" stroke="#006747" strokeWidth="1.5" strokeDasharray="8,10" opacity="0.4" />
            <text x="534" y="110" fill="#475569" fontSize="10" fontWeight="bold">LEROY COLLINS BLVD</text>

            {/* Alumni Drive */}
            <path d="M 60 590 L 940 590" stroke="#ffffff" strokeWidth="12" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.06))" />
            <text x="120" y="582" fill="#475569" fontSize="10" fontWeight="bold">ALUMNI DRIVE</text>

            {/* Holly Drive */}
            <path d="M 60 150 L 940 150" stroke="#ffffff" strokeWidth="12" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.06))" />
            <text x="120" y="142" fill="#475569" fontSize="10" fontWeight="bold">HOLLY DRIVE</text>

            {/* USF Beard Drive */}
            <path d="M 220 120 L 220 540" stroke="#ffffff" strokeWidth="10" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.06))" />
            <text x="228" y="240" fill="#475569" fontSize="9" fontWeight="bold" transform="rotate(90, 228, 240)">USF BEARD DRIVE</text>

            {/* USF Palm Drive */}
            <path d="M 220 290 L 800 290" stroke="#ffffff" strokeWidth="9" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.06))" />
            <text x="320" y="282" fill="#475569" fontSize="9" fontWeight="bold">USF PALM DRIVE</text>

            {/* Genshaft / Maple Drive Link */}
            <path d="M 380 150 L 380 430 L 700 430" stroke="#ffffff" strokeWidth="8" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.06))" />

            {/* Sycamore Drive */}
            <path d="M 180 50 L 180 150" stroke="#ffffff" strokeWidth="9" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.06))" />
            <text x="190" y="90" fill="#475569" fontSize="9" fontWeight="bold">SYCAMORE DR</text>
          </g>

          {/* 3. DYNAMIC WALKING VECTOR PATH */}
          {walkingPathElement}

          {/* 5. PARKING FACILITIES (Garages & Surface Lots) */}
          {facilities.map((fac) => {
            const isGarage = fac.type === 'garage';
            if (isGarage && !showGarages) return null;
            if (!isGarage && !showSurfaceLots) return null;

            const pt = projectToSvg(fac.coordinates.latitude, fac.coordinates.longitude);
            const route = getFacilityRoute(fac.id);
            const color = getOccupancyColor(route);
            const isRecommended = recommendedOption?.facility.id === fac.id;
            const isSelected = activeRouteOption?.facility.id === fac.id;
            const isPinnedCar = pinnedCarLotId === fac.id;

            const lotTrades = activeTrades.filter(
              (t) => t.facilityId === fac.id && t.status === 'available'
            );

            return (
              <g
                key={fac.id}
                transform={`translate(${pt.x}, ${pt.y})`}
                className="cursor-pointer group"
                onClick={() => {
                  onSelectFacility(fac);
                  setInspectedEntity({ type: 'facility', data: { facility: fac, route } });
                }}
              >
                {/* Active Bull Trade Beacon Radar */}
                {showBullTrades && lotTrades.length > 0 && (
                  <g>
                    <circle
                      r="36"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="2"
                      className="animate-ping"
                      opacity="0.5"
                    />
                    <circle
                      r="28"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      className="pulse-active"
                      opacity="0.7"
                    />
                  </g>
                )}

                {/* Recommended Lot Glow Halo */}
                {isRecommended && (
                  <circle
                    r={isGarage ? 34 : 26}
                    fill="none"
                    stroke="#cfc493"
                    strokeWidth="3.5"
                    strokeDasharray="5,4"
                    className="pulse-active"
                  />
                )}

                {/* Selected Lot Focus Halo */}
                {isSelected && !isRecommended && (
                  <circle
                    r={isGarage ? 32 : 24}
                    fill="none"
                    stroke="#006747"
                    strokeWidth="3"
                    className="pulse-active"
                  />
                )}

                {/* Pinned Car Marker Halo */}
                {isPinnedCar && (
                  <circle
                    r={isGarage ? 40 : 32}
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2.5"
                    strokeDasharray="4,4"
                    className="animate-spin"
                    style={{ animationDuration: '8s' }}
                  />
                )}

                {/* Parking Shape Body */}
                {isGarage ? (
                  <g>
                    {/* Shadow Plate */}
                    <rect
                      x="-22"
                      y="-22"
                      width="44"
                      height="44"
                      rx="10"
                      fill="#ffffff"
                      stroke={isSelected ? '#006747' : isRecommended ? '#cfc493' : '#cbd5e1'}
                      strokeWidth={isSelected || isRecommended ? 3 : 1.5}
                      filter="drop-shadow(0 4px 6px rgba(0,0,0,0.12))"
                    />
                    {/* Level Floor Lines for Garage iconography */}
                    <line x1="-14" y1="-7" x2="14" y2="-7" stroke="#e2e8f0" strokeWidth="1.5" />
                    <line x1="-14" y1="5" x2="14" y2="5" stroke="#e2e8f0" strokeWidth="1.5" />

                    <text
                      x="0"
                      y="1"
                      fill={color}
                      fontSize="14"
                      fontWeight="900"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      G
                    </text>
                  </g>
                ) : (
                  <g>
                    <circle
                      r="16"
                      fill="#ffffff"
                      stroke={isSelected ? '#006747' : isRecommended ? '#cfc493' : '#cbd5e1'}
                      strokeWidth={isSelected || isRecommended ? 3 : 1.5}
                      filter="drop-shadow(0 3px 5px rgba(0,0,0,0.1))"
                    />
                    <text
                      x="0"
                      y="1"
                      fill={color}
                      fontSize="12"
                      fontWeight="900"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      P
                    </text>
                  </g>
                )}

                {/* Facility Features Badges (EV) */}
                <g transform={`translate(${isGarage ? 14 : 10}, ${isGarage ? -14 : -10})`}>
                  {fac.features.evCharging && (
                    <circle r="6" fill="#059669" stroke="#ffffff" strokeWidth="1.5" />
                  )}
                </g>

                {/* Occupancy Percentage & Open Spots Pill Below */}
                <g transform="translate(0, 26)">
                  <rect
                    x="-36"
                    y="-9"
                    width="72"
                    height="18"
                    rx="9"
                    fill="#ffffff"
                    stroke={color}
                    strokeWidth="1.5"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                  />
                  <text
                    x="0"
                    y="1"
                    fill={color}
                    fontSize="10"
                    fontWeight="800"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {route ? `${route.currentOccupancyPercentage}% full` : 'Check'}
                  </text>
                </g>

                {/* Recommended Tag Pill */}
                {isRecommended && (
                  <g transform="translate(0, -32)">
                    <rect
                      x="-42"
                      y="-10"
                      width="84"
                      height="18"
                      rx="9"
                      fill="#006747"
                      stroke="#cfc493"
                      strokeWidth="1.5"
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                    />
                    <text
                      x="0"
                      y="0"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="900"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      TOP PICK #1
                    </text>
                  </g>
                )}

                {/* Pinned Car Indicator */}
                {isPinnedCar && (
                  <g transform="translate(0, -48)">
                    <rect
                      x="-44"
                      y="-10"
                      width="88"
                      height="18"
                      rx="9"
                      fill="#059669"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                    />
                    <text
                      x="0"
                      y="0"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      YOUR CAR PIN
                    </text>
                  </g>
                )}

                {/* Facility Title Tag */}
                <text
                  x="0"
                  y={isRecommended ? 50 : 48}
                  fill="#1e293b"
                  fontSize="10"
                  fontWeight="700"
                  textAnchor="middle"
                  className="group-hover:fill-[#006747] transition-colors"
                >
                  {fac.name.split('(')[0].replace('Richard A. ', '')}
                </text>
              </g>
            );
          })}

          {/* 6. ACADEMIC & CAMPUS BUILDINGS */}
          {buildings.map((bldg) => {
            const pt = projectToSvg(bldg.coordinates.latitude, bldg.coordinates.longitude);
            const isSelected = selectedBuilding?.id === bldg.id;

            return (
              <g
                key={bldg.id}
                transform={`translate(${pt.x}, ${pt.y})`}
                className="cursor-pointer group"
                onClick={() => {
                  onSelectBuilding(bldg);
                  setInspectedEntity({ type: 'building', data: bldg });
                }}
              >
                {/* Selected Target Pin Animation */}
                {isSelected && (
                  <g>
                    <circle
                      r="28"
                      fill="#006747"
                      fillOpacity="0.2"
                      stroke="#006747"
                      strokeWidth="2.5"
                      className="animate-ping"
                    />
                    <circle
                      r="20"
                      fill="#006747"
                      fillOpacity="0.3"
                      stroke="#006747"
                      strokeWidth="1.5"
                    />
                  </g>
                )}

                {/* Building Marker Box */}
                <rect
                  x="-18"
                  y="-15"
                  width="36"
                  height="30"
                  rx="8"
                  fill={isSelected ? '#006747' : '#ffffff'}
                  stroke={isSelected ? '#cfc493' : '#94a3b8'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  filter="drop-shadow(0 3px 5px rgba(0,0,0,0.12))"
                />

                {/* Building Code Monogram */}
                <text
                  x="0"
                  y="3"
                  fill={isSelected ? '#ffffff' : '#006747'}
                  fontSize="11"
                  fontWeight="900"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {bldg.code}
                </text>

                {/* Building Name Tag */}
                <text
                  x="0"
                  y="27"
                  fill={isSelected ? '#006747' : '#475569'}
                  fontSize="10"
                  fontWeight={isSelected ? 'bold' : '600'}
                  textAnchor="middle"
                  className="group-hover:fill-[#006747] transition-colors"
                >
                  {bldg.name.length > 20 ? `${bldg.name.slice(0, 18)}...` : bldg.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* 7. FLOATING LIVE INSPECTOR MODAL (LIGHT THEME) */}
        {inspectedEntity && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-xl z-30">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-50 text-[#006747] border border-emerald-200 shadow-sm">
                  {inspectedEntity.type === 'facility' && <Warehouse size={16} />}
                  {inspectedEntity.type === 'building' && <MapPin size={16} />}
                </span>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {inspectedEntity.type === 'facility' && inspectedEntity.data.facility.name}
                    {inspectedEntity.type === 'building' && inspectedEntity.data.name}
                  </h4>
                  <span className="text-[11px] font-semibold text-[#006747]">
                    {inspectedEntity.type === 'facility' &&
                      `${inspectedEntity.data.facility.type === 'garage' ? `${inspectedEntity.data.facility.levels} Levels Garage` : 'Surface Lot'}`}
                    {inspectedEntity.type === 'building' && `[${inspectedEntity.data.code}] ${inspectedEntity.data.category.toUpperCase()}`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectedEntity(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold px-1.5 py-0.5 rounded"
              >
                ✕
              </button>
            </div>

            {/* Facility Details */}
            {inspectedEntity.type === 'facility' && (
              <div className="space-y-2 text-xs">
                {inspectedEntity.data.route ? (
                  <>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-600 font-medium">Estimated occupancy:</span>
                      <strong className={`font-black ${inspectedEntity.data.route.currentOccupancyPercentage >= 90 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {inspectedEntity.data.route.currentOccupancyPercentage}% full (~{inspectedEntity.data.route.availableSpotsEstimate} spots open)
                      </strong>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-600 font-medium">Walk to {selectedBuilding?.code || 'Destination'}:</span>
                      <span className="font-black text-[#006747]">
                        {inspectedEntity.data.route.walkingTimeMinutes} mins ({inspectedEntity.data.route.estimatedWalkingDistanceMeters}m)
                      </span>
                    </div>

                    {/* Level breakdown if garage */}
                    {inspectedEntity.data.route.levels && inspectedEntity.data.route.levels.length > 0 && (
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold text-slate-700 block flex items-center gap-1">
                          <Layers size={11} /> Estimated spaces by floor:
                        </span>
                        <div className="grid grid-cols-2 gap-1 text-[10px]">
                          {inspectedEntity.data.route.levels.map((lvl: any) => (
                            <div key={lvl.levelNumber} className="flex justify-between bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              <span className="text-slate-600 font-medium">{lvl.levelName}:</span>
                              <strong className={lvl.status === 'full' ? 'text-rose-600' : 'text-emerald-700'}>
                                {lvl.status === 'full' ? 'FULL' : `${lvl.availableSpots} open`}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-[11px]">
                      {inspectedEntity.data.route.isLegal ? (
                        <span className="text-emerald-700 flex items-center gap-1 font-medium">
                          <ShieldCheck size={13} className="text-emerald-600" /> {inspectedEntity.data.route.legalityReason}
                        </span>
                      ) : (
                        <span className="text-rose-700 flex items-center gap-1 font-medium">
                          <ShieldAlert size={13} className="text-rose-600" /> {inspectedEntity.data.route.legalityReason}
                        </span>
                      )}
                    </div>

                    {/* Active Bull Trades in this lot */}
                    {activeTrades.filter((t) => t.facilityId === inspectedEntity.data.facility.id && t.status === 'available').map((trade) => (
                      <div key={trade.id} className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-emerald-900">Student Spot Opening</div>
                          <div className="text-[10px] text-emerald-700">{trade.levelOrSection} · leaves in ~{trade.departureInMinutes}m</div>
                        </div>
                        {onClaimSpot && (
                          <button
                            onClick={() => {
                              onClaimSpot(trade.id);
                              setInspectedEntity(null);
                            }}
                            className="py-1 px-2.5 rounded-lg bg-[#006747] hover:bg-[#004c34] text-white font-bold text-[10px] shadow-sm"
                          >
                            Claim
                          </button>
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-slate-500">Select this lot to calculate direct walking route and legality.</p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      onSelectFacility(inspectedEntity.data.facility);
                      setInspectedEntity(null);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#006747] hover:bg-[#004c34] text-white font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Navigation size={13} /> Focus Route
                  </button>

                  {onPinCar && (
                    <button
                      onClick={() => {
                        onPinCar(inspectedEntity.data.facility.id);
                        setInspectedEntity(null);
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs transition-colors flex items-center gap-1"
                    >
                      <Car size={13} /> Pin My Car
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Building Details */}
            {inspectedEntity.type === 'building' && (
              <div className="space-y-2 text-xs">
                <p className="text-slate-600 leading-relaxed">{inspectedEntity.data.description}</p>
                <div className="text-[11px] text-[#006747]">
                  <strong>Departments:</strong> {inspectedEntity.data.popularDepartments.join(', ')}
                </div>
                <button
                  onClick={() => {
                    onSelectBuilding(inspectedEntity.data);
                    setInspectedEntity(null);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-[#006747] hover:bg-[#004c34] text-white font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MapPin size={13} /> Set as My Destination Class
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map Bottom Legend Bar */}
      <div className="p-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-4 flex-wrap font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Open (&lt;75%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Busy (75-90%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Full (90%+)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Citation Risk / Prohibited
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className="flex items-center gap-1 text-[#006747]">
            <Warehouse size={13} /> Garage
          </span>
          <span className="flex items-center gap-1 text-emerald-600">
            <Zap size={13} /> EV Station
          </span>
        </div>
      </div>
    </div>
  );
};
