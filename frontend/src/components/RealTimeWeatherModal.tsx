import React, { useState } from 'react';
import { LiveWeatherCondition } from '../types/campus';
import {
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Thermometer,
  ShieldCheck,
  RefreshCw,
  X,
  Compass,
  CheckCircle2
} from 'lucide-react';

interface RealTimeWeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: LiveWeatherCondition | null;
  onRefreshLiveWeather: () => Promise<void>;
  onApplyOverride?: (temp: number, isRaining: boolean) => void;
}

export const RealTimeWeatherModal: React.FC<RealTimeWeatherModalProps> = ({
  isOpen,
  onClose,
  weather,
  onRefreshLiveWeather,
  onApplyOverride
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshLiveWeather();
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const tempF = weather?.temperatureF ?? 75;
  const feelsLikeF = weather?.apparentTemperatureF ?? tempF;
  const humidity = weather?.relativeHumidity ?? 65;
  const windMph = weather?.windSpeedMph ?? 7;
  const isRaining = weather?.isRaining ?? false;
  const summary = weather?.summary ?? 'Partly Cloudy';
  const rainProb = weather?.precipitationProbability ?? (isRaining ? 85 : 10);
  const source = weather?.source ?? 'live_open_meteo';

  // Tampa Sweat Score calculation
  const sweatScore = Math.min(
    100,
    Math.max(
      10,
      isRaining ? 90 : Math.round((feelsLikeF - 65) * 2.2)
    )
  );

  let sweatRating = 'Comfortable';
  let sweatColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (sweatScore >= 80) {
    sweatRating = 'Extreme Heat';
    sweatColor = 'text-rose-800 bg-rose-50 border-rose-200';
  } else if (sweatScore >= 60) {
    sweatRating = 'High Sweat Risk';
    sweatColor = 'text-amber-800 bg-amber-50 border-amber-200';
  } else if (sweatScore >= 35) {
    sweatRating = 'Moderate Tampa Warmth';
    sweatColor = 'text-sky-800 bg-sky-50 border-sky-200';
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-[560px] max-w-full shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-emerald-50 text-[#006747] border border-emerald-200 shadow-xs">
              {isRaining ? <CloudRain size={22} className="text-blue-600" /> : <Sun size={22} className="text-amber-500" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">
                  USF Tampa Real-Time Weather
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-[#006747] border border-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {source === 'live_open_meteo' ? 'LIVE NOAA / METEO' : 'SIMULATED'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Campus Coordinates: 28.0587° N, -82.4139° W · Tampa, FL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Condition Hero Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border border-slate-200 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 tracking-tight">
                  {tempF}°F
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Feels like {feelsLikeF}°F
                </span>
              </div>
              <div className="text-sm font-extrabold text-[#006747] mt-1 flex items-center gap-1.5">
                {isRaining ? <CloudRain size={16} /> : <Sun size={16} />}
                <span>{summary}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Precipitation Probability: <strong className="text-slate-800">{rainProb}%</strong>
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-[#006747]' : 'text-slate-500'} />
              <span>{isRefreshing ? 'Fetching NOAA...' : 'Sync Live Weather'}</span>
            </button>
          </div>

          {refreshSuccess && (
            <div className="mt-3 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 size={13} className="text-[#006747]" />
              <span>Successfully synchronized with live USF Tampa weather station.</span>
            </div>
          )}

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Droplets size={12} className="text-blue-500" /> Humidity
              </span>
              <span className="font-extrabold text-sm text-slate-900 block mt-0.5">
                {humidity}%
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Wind size={12} className="text-teal-500" /> Wind Speed
              </span>
              <span className="font-extrabold text-sm text-slate-900 block mt-0.5">
                {windMph} mph
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Thermometer size={12} className="text-amber-500" /> Sweat Score
              </span>
              <span className="font-extrabold text-sm text-slate-900 block mt-0.5">
                {sweatScore} / 100
              </span>
            </div>
          </div>
        </div>

        {/* Tampa Sweat Index & Parking Impact Advisory */}
        <div className={`p-3.5 rounded-2xl border ${sweatColor} text-xs space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="font-black uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck size={14} /> Florida Comfort & Parking Guidance
            </span>
            <span className="font-extrabold px-2 py-0.5 rounded-md bg-white/80 text-xs">
              {sweatRating}
            </span>
          </div>
          <p className="font-medium text-slate-700 leading-relaxed">
            {isRaining
              ? 'Active rain in Tampa: Covered garages (Richard A. Beard Garage, Collins Blvd Garage, Laurel Garage, Crescent Hill Garage) are automatically prioritized. Uncovered sidewalk routes are calculated with +15% travel time for umbrella walking.'
              : feelsLikeF >= 92
              ? `High heat index of ${feelsLikeF}°F: Shaded, covered garages recommended to prevent stepping into a 130°F sun-baked vehicle after class.`
              : 'Pleasant Tampa walking conditions: All campus parking facilities and sidewalks are optimal. Standard walking speed estimates apply.'}
          </p>
        </div>

        {/* 6-Hour Hourly Forecast Strip */}
        {weather?.hourlyForecast && weather.hourlyForecast.length > 0 && (
          <div className="space-y-2 text-xs">
            <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Compass size={14} className="text-[#006747]" /> Next 6-Hour Campus Outlook
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {weather.hourlyForecast.slice(0, 6).map((hf, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center"
                >
                  <span className="text-[10px] text-slate-500 font-bold block">{hf.time}</span>
                  <span className="text-xs font-black text-slate-900 block my-1">
                    {hf.temperatureF}°
                  </span>
                  <div className="flex items-center justify-center gap-0.5 text-[10px] text-blue-700 font-bold">
                    <CloudRain size={10} />
                    <span>{hf.rainProbability}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Weather Simulator Switches */}
        {onApplyOverride && (
          <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5">
            <span className="text-slate-500 font-bold text-[11px]">Quick Weather Scenarios:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onApplyOverride(98, false)}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-bold"
              >
                98°F Tampa Scorcher
              </button>
              <button
                onClick={() => onApplyOverride(76, true)}
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-[11px] font-bold"
              >
                Tampa Downpour (Rain)
              </button>
              <button
                onClick={() => handleRefresh()}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#006747] text-[11px] font-bold"
              >
                Live Tampa Station
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
