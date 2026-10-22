import React, { useState, useEffect } from 'react';
import { CampusMap } from './components/CampusMap';
import { RouteCard } from './components/RouteCard';
import { MultimodalCard } from './components/MultimodalCard';
import { SchedulePlanner } from './components/SchedulePlanner';
import { BullTradeFeed } from './components/BullTradeFeed';
import { DebuggerDrawer } from './components/DebuggerDrawer';
import { RealTimeWeatherModal } from './components/RealTimeWeatherModal';
import {
  Building,
  ParkingFacility,
  PermitType,
  RoutingResponse,
  RouteOption,
  SmartDeparturePlan,
  ClassSession,
  BullTradeSpot,
  BluetoothSignalEvent,
  BullRunnerRoute,
  BullRunnerStop,
  LiveWeatherCondition
} from './types/campus';
import {
  Calendar,
  CloudRain,
  Compass,
  MapPin,
  Radio,
  Sliders,
  ThermometerSun,
  Car,
  Navigation
} from 'lucide-react';

export const App: React.FC = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  // Campus & Intelligence Data
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [facilities, setFacilities] = useState<ParkingFacility[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedPermit, setSelectedPermit] = useState<PermitType>('S');
  const [routingData, setRoutingData] = useState<RoutingResponse | null>(null);
  const [activeRouteOption, setActiveRouteOption] = useState<RouteOption | null>(null);
  const [departurePlan, setDeparturePlan] = useState<SmartDeparturePlan | null>(null);
  const [schedule, setSchedule] = useState<ClassSession[]>([]);
  const [trades, setTrades] = useState<BullTradeSpot[]>([]);
  const [recentTelemetry, setRecentTelemetry] = useState<BluetoothSignalEvent[]>([]);

  // Transit Data from Backend
  const [bullRunnerRoutes, setBullRunnerRoutes] = useState<BullRunnerRoute[]>([]);
  const [bullRunnerStops, setBullRunnerStops] = useState<BullRunnerStop[]>([]);

  // Weather & Clock State
  const [temperatureF, setTemperatureF] = useState(89);
  const [isRaining, setIsRaining] = useState(false);
  const [liveWeather, setLiveWeather] = useState<LiveWeatherCondition | null>(null);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [simulatedTime, setSimulatedTime] = useState<string | null>(null);

  // UI state
  const [isDebuggerOpen, setIsDebuggerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'routes' | 'schedule' | 'trades'>('routes');
  const [pinnedCarLotId, setPinnedCarLotId] = useState<string | null>(null);

  // 1. Initial Data Fetch from Backend APIs
  useEffect(() => {
    // Campus buildings
    fetch('/api/campus/buildings')
      .then((res) => res.json())
      .then((data) => {
        setBuildings(data.buildings || []);
        if (data.buildings && data.buildings.length > 0) {
          // Default to BSN (Muma College of Business)
          const defaultBldg =
            data.buildings.find((b: Building) => b.code === 'BSN') || data.buildings[0];
          setSelectedBuilding(defaultBldg);
        }
      })
      .catch((err) => console.error('Error fetching buildings:', err));

    // Parking facilities
    fetch('/api/campus/facilities')
      .then((res) => res.json())
      .then((data) => setFacilities(data.facilities || []))
      .catch((err) => console.error('Error fetching facilities:', err));

    // Bull Runner Transit routes and stops
    fetch('/api/transit/routes')
      .then((res) => res.json())
      .then((data) => {
        setBullRunnerRoutes(data.routes || []);
        setBullRunnerStops(data.stops || []);
      })
      .catch((err) => console.error('Error fetching transit routes:', err));

    // Class schedule
    fetch('/api/schedule')
      .then((res) => res.json())
      .then((data) => setSchedule(data.schedule || []))
      .catch((err) => console.error('Error fetching schedule:', err));

    // Spot Exchange trades
    fetch('/api/exchange/trades')
      .then((res) => res.json())
      .then((data) => setTrades(data.trades || []))
      .catch((err) => console.error('Error fetching trades:', err));

    // Telemetry events
    fetch('/api/exchange/telemetry')
      .then((res) => res.json())
      .then((data) => setRecentTelemetry(data.recentEvents || []))
      .catch((err) => console.error('Error fetching telemetry:', err));

    // Current weather
    fetch('/api/weather')
      .then((res) => res.json())
      .then((data) => {
        if (data.weather) {
          setLiveWeather(data.weather);
          setTemperatureF(data.weather.temperatureF);
          setIsRaining(data.weather.isRaining);
        }
      })
      .catch((err) => console.error('Error fetching weather:', err));
  }, []);

  // 2. Fetch Routing & Schedule Plan whenever parameters change
  useEffect(() => {
    if (!selectedBuilding) return;

    const query = new URLSearchParams({
      destination: selectedBuilding.id,
      permit: selectedPermit,
      temp: temperatureF.toString(),
      rain: isRaining.toString()
    });

    if (simulatedTime) {
      query.append('simulatedTime', simulatedTime);
    }

    const controller = new AbortController();
    setApiError(null);
    setRoutingData(null);
    setActiveRouteOption(null);
    fetch(`/api/routing/recommend?${query.toString()}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Unable to load parking recommendations. Please try again.');
        return res.json();
      })
      .then((data: RoutingResponse) => {
        setRoutingData(data);
        setActiveRouteOption(data.recommendedOption);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setApiError(err.message);
      });

    fetch(`/api/schedule/next-departure?permit=${selectedPermit}`)
      .then((res) => res.json())
      .then((data) => setDeparturePlan(data.plan))
      .catch((err) => console.error('Error fetching departure plan:', err));
    return () => controller.abort();
  }, [selectedBuilding, selectedPermit, temperatureF, isRaining, simulatedTime]);

  const handleRefreshSchedule = () => {
    fetch('/api/schedule')
      .then((res) => res.json())
      .then((data) => setSchedule(data.schedule || []))
      .catch((err) => console.error('Error refreshing schedule:', err));

    fetch(`/api/schedule/next-departure?permit=${selectedPermit}`)
      .then((res) => res.json())
      .then((data) => setDeparturePlan(data.plan))
      .catch((err) => console.error('Error refreshing departure plan:', err));
  };

  const handleSelectBuildingCode = (code: string) => {
    const found = buildings.find(
      (b) => b.code.toUpperCase() === code.toUpperCase() || b.id === code
    );
    if (found) {
      setSelectedBuilding(found);
      setActiveTab('routes');
    }
  };

  const handleClaimSpot = (tradeId: string) => {
    fetch(`/api/exchange/trades/${tradeId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName: 'You (Bull Commuter)' })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.trade) {
          setTrades((prev) => prev.map((t) => (t.id === tradeId ? data.trade : t)));
        }
      })
      .catch((err) => console.error('Error claiming spot:', err));
  };

  const handleBroadcastDeparture = (trade: any) => {
    fetch('/api/exchange/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trade)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.trade) {
          setTrades((prev) => [data.trade, ...prev]);
        }
      })
      .catch((err) => console.error('Error broadcasting departure:', err));
  };

  const handleSimulateBluetooth = (
    eventType: 'DISCONNECTED' | 'CONNECTED',
    facilityId: string
  ) => {
    fetch('/api/exchange/simulate-bluetooth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, facilityId })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.event) {
          setRecentTelemetry((prev) => [data.event, ...prev.slice(0, 9)]);
          if (eventType === 'DISCONNECTED') {
            setPinnedCarLotId(facilityId);
          } else {
            setPinnedCarLotId(null);
          }
        }
      })
      .catch((err) => console.error('Error simulating bluetooth:', err));
  };

  const handleSetFacilityCapacity = (facilityId: string, percentage: number) => {
    fetch('/api/occupancy/override-facility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityId, percentage })
    })
      .then(() => {
        if (selectedBuilding) {
          setSelectedBuilding({ ...selectedBuilding });
        }
      })
      .catch((err) => console.error('Error overriding capacity:', err));
  };

  const handleSimulateTime = (time: string | null) => {
    setSimulatedTime(time);
    fetch('/api/occupancy/simulate-time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeString: time })
    }).catch((err) => console.error('Error setting simulated time:', err));
  };

  const handleWeatherChange = (temp: number, rain: boolean) => {
    setTemperatureF(temp);
    setIsRaining(rain);
    fetch('/api/weather/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temperatureF: temp, isRaining: rain })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.weather) setLiveWeather(data.weather);
      })
      .catch((err) => console.error('Error overriding weather:', err));
  };

  const handleRefreshLiveWeather = async () => {
    try {
      const res = await fetch('/api/weather/live', { method: 'POST' });
      const data = await res.json();
      if (data.weather) {
        setLiveWeather(data.weather);
        setTemperatureF(data.weather.temperatureF);
        setIsRaining(data.weather.isRaining);
      }
    } catch (err) {
      console.error('Error refreshing live weather:', err);
    }
  };

  const pinnedLot = facilities.find((f) => f.id === pinnedCarLotId);

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-slate-800 flex flex-col font-sans">
      {/* Top USF Navigation Header (Clean Light Theme) */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & USF Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#006747] text-white flex items-center justify-center text-xl shadow-sm border border-[#cfc493]">
              <Car size={22} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                  BullPark <span className="text-[#006747]">USF</span>
                </h1>
                <span className="text-[10px] font-black bg-emerald-50 text-[#006747] px-2 py-0.5 rounded-full border border-emerald-200 tracking-wider">
                  TAMPA CAMPUS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Find parking near your class
              </p>
            </div>
          </div>

          {/* Quick Header Controls */}
          <div className="flex items-center gap-2.5">
            {/* USF Permit Tier Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs shadow-xs">
              <span className="text-slate-500 text-[11px] font-semibold">Permit:</span>
              <select
                value={selectedPermit}
                onChange={(e) => setSelectedPermit(e.target.value as PermitType)}
                className="bg-transparent font-black text-[#006747] outline-none cursor-pointer"
              >
                <option value="S">S - Commuter Student</option>
                <option value="R">R - Resident Student</option>
                <option value="E">E - Faculty / Staff</option>
                <option value="D">D - Daily Visitor</option>
                <option value="Y">Y - Park & Ride</option>
              </select>
            </div>

            {/* Florida Weather & Sweat Score Pill (Opens Real-Time Weather App) */}
            <div
              onClick={() => setIsWeatherModalOpen(true)}
              className="hidden sm:flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs cursor-pointer transition-all shadow-xs group"
              title="Click to open Real-Time USF Tampa Weather Station"
            >
              {isRaining ? (
                <>
                  <CloudRain size={15} className="text-blue-600 animate-bounce" />
                  <span className="text-blue-900 font-bold">Tampa Rain · {temperatureF}°F</span>
                </>
              ) : (
                <>
                  <ThermometerSun size={15} className="text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-slate-800 font-bold">
                    {temperatureF}°F · Feels {liveWeather?.apparentTemperatureF ?? temperatureF}°F
                  </span>
                </>
              )}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="Live weather station active" />
            </div>

            {/* Debug Drawer Toggle */}
            <button
              onClick={() => setIsDebuggerOpen(!isDebuggerOpen)}
              className="flex items-center gap-1.5 bg-[#006747] hover:bg-[#004c34] text-white rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-sm"
            >
              <Sliders size={14} />
              <span className="hidden md:inline">Simulator</span>
            </button>
          </div>
        </div>
      </header>

      {/* Pinned Car Alert Banner (Light Mode) */}
      {pinnedLot && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-xs text-emerald-900 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <Car size={15} className="text-emerald-700" />
              <span>
                Vehicle Pinned at: <strong className="text-emerald-950 font-bold">{pinnedLot.name}</strong> ({pinnedLot.isCovered ? 'Covered Garage' : 'Surface Lot'})
              </span>
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const route = routingData?.rankedOptions.find((r) => r.facility.id === pinnedLot.id);
                  if (route) setActiveRouteOption(route);
                }}
                className="text-xs font-bold text-[#006747] hover:underline flex items-center gap-1"
              >
                <Navigation size={12} /> Show Path to My Car
              </button>
              <button
                onClick={() => setPinnedCarLotId(null)}
                className="text-slate-500 hover:text-slate-800 underline text-[11px]"
              >
                Clear Pin
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="max-w-7xl mx-auto w-full px-4 pt-3 text-xs text-slate-500">Demo campus data · Parking availability and walking times are estimates.</p>
      {apiError && <p role="alert" className="max-w-7xl mx-auto px-4 py-2 text-sm text-red-700">{apiError}</p>}
      {/* Main Workspace Layout */}
      <main className="max-w-7xl mx-auto w-full flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Interactive Vector Map & Building Selector (7 Cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Destination Classroom Picker Card */}
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-50 text-[#006747] border border-emerald-200 shadow-xs">
                <MapPin size={20} />
              </span>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                  Select Destination Classroom Building
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedBuilding?.id || ''}
                    onChange={(e) => {
                      const b = buildings.find((x) => x.id === e.target.value);
                      if (b) setSelectedBuilding(b);
                    }}
                    className="bg-transparent font-black text-sm text-slate-900 outline-none cursor-pointer border-b-2 border-[#006747] pb-0.5 hover:border-[#004c34] transition-colors"
                  >
                    {buildings.map((bldg) => (
                      <option key={bldg.id} value={bldg.id} className="text-slate-900">
                        [{bldg.code}] {bldg.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {selectedBuilding && (
              <span className="text-xs text-slate-500 font-medium max-w-xs truncate hidden sm:inline">
                {selectedBuilding.description}
              </span>
            )}
          </div>

          {/* Interactive USF Cartographic Vector Map (Light Cartography) */}
          <CampusMap
            buildings={buildings}
            facilities={facilities}
            selectedBuilding={selectedBuilding}
            recommendedOption={routingData?.recommendedOption || null}
            activeRouteOption={activeRouteOption}
            onSelectBuilding={(bldg) => setSelectedBuilding(bldg)}
            onSelectFacility={(fac) => {
              const route = routingData?.rankedOptions.find((r) => r.facility.id === fac.id);
              if (route) setActiveRouteOption(route);
            }}
            rankedOptions={routingData?.rankedOptions || []}
            bullRunnerRoutes={bullRunnerRoutes}
            bullRunnerStops={bullRunnerStops}
            activeTrades={trades}
            pinnedCarLotId={pinnedCarLotId}
            onPinCar={(facId) => setPinnedCarLotId(facId)}
            onClaimSpot={handleClaimSpot}
          />
        </div>

        {/* Right Column: Intelligence Features & Action Tabs (5 Cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Navigation Pill Tabs */}
          <div className="flex border border-slate-200 bg-white rounded-2xl p-1 gap-1 shadow-xs">
            <button
              onClick={() => setActiveTab('routes')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'routes'
                  ? 'bg-[#006747] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass size={14} /> Nearest Lots ({routingData?.rankedOptions.filter((r) => r.isLegal).length || 0})
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'schedule'
                  ? 'bg-[#006747] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar size={14} /> Schedule
            </button>

            <button
              onClick={() => setActiveTab('trades')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'trades'
                  ? 'bg-[#006747] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Radio size={14} /> Spot exchange ({trades.filter((t) => t.status === 'available').length})
            </button>
          </div>

          {/* TAB 1: Nearest Parking Routes */}
          {activeTab === 'routes' && (
            <div className="space-y-3 overflow-y-auto max-h-[640px] pr-1">
              {/* Bull Runner Multimodal Alternative (Shown when top garages are congested) */}
              {routingData?.multimodalFallback && (
                <MultimodalCard
                  fallback={routingData.multimodalFallback}
                  onFocusTransitLot={(lotId) => {
                    const found = routingData?.rankedOptions.find((r) => r.facility.id === lotId);
                    if (found) setActiveRouteOption(found);
                  }}
                />
              )}

              {/* Ranked Parking Option Cards */}
              {routingData?.rankedOptions.map((option, idx) => (
                <RouteCard
                  key={option.facility.id}
                  option={option}
                  rank={idx + 1}
                  isRecommended={routingData.recommendedOption?.facility.id === option.facility.id}
                  isSelected={activeRouteOption?.facility.id === option.facility.id}
                  isPinned={pinnedCarLotId === option.facility.id}
                  onSelect={() => setActiveRouteOption(option)}
                  onPinCar={(facId) => setPinnedCarLotId(facId)}
                />
              ))}
            </div>
          )}

          {/* TAB 2: Class Schedule & Smart Departure */}
          {activeTab === 'schedule' && (
            <SchedulePlanner
              departurePlan={departurePlan}
              schedule={schedule}
              buildings={buildings}
              onSelectBuildingCode={handleSelectBuildingCode}
              onRefreshSchedule={handleRefreshSchedule}
            />
          )}

          {/* TAB 3: Bull Trade Peer-to-Peer & Bluetooth Beacon Simulator */}
          {activeTab === 'trades' && (
            <BullTradeFeed
              trades={trades}
              onClaimSpot={handleClaimSpot}
              onBroadcastDeparture={handleBroadcastDeparture}
              onSimulateBluetooth={handleSimulateBluetooth}
              recentTelemetry={recentTelemetry}
            />
          )}
        </div>
      </main>

      {/* Real-Time USF Tampa Weather Modal */}
      <RealTimeWeatherModal
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        weather={liveWeather}
        onRefreshLiveWeather={handleRefreshLiveWeather}
        onApplyOverride={handleWeatherChange}
      />

      {/* USF Intelligence Module Debugger Drawer */}
      <DebuggerDrawer
        isOpen={isDebuggerOpen}
        onClose={() => setIsDebuggerOpen(false)}
        onSimulateTime={handleSimulateTime}
        onToggleRain={(rain) => handleWeatherChange(temperatureF, rain)}
        onSetTemperature={(temp) => handleWeatherChange(temp, isRaining)}
        onSetFacilityCapacity={handleSetFacilityCapacity}
        currentSimulatedTime={simulatedTime}
        isRaining={isRaining}
        temperatureF={temperatureF}
        rawRoutingResponse={routingData}
      />
    </div>
  );
};
