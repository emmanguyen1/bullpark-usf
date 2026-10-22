import React, { useState } from 'react';
import { RouteOption } from '../types/campus';
import {
  Footprints,
  ShieldAlert,
  ShieldCheck,
  ThermometerSun,
  Warehouse,
  Car,
  Zap,
  Bus,
  Navigation,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';

interface RouteCardProps {
  option: RouteOption;
  rank: number;
  isRecommended: boolean;
  isSelected: boolean;
  isPinned: boolean;
  onSelect: () => void;
  onPinCar: (facilityId: string) => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({
  option,
  rank,
  isRecommended,
  isSelected,
  isPinned,
  onSelect,
  onPinCar
}) => {
  const [showLevels, setShowLevels] = useState(false);

  const {
    facility,
    walkingTimeMinutes,
    estimatedWalkingDistanceMeters,
    isLegal,
    legalityReason,
    ruleType,
    currentOccupancyPercentage,
    availableSpotsEstimate,
    turnoverNotes,
    levels,
    weatherRecommendationBadge
  } = option;

  const getOccupancyBarColor = (pct: number) => {
    if (pct >= 90) return 'from-rose-500 to-red-600';
    if (pct >= 75) return 'from-amber-400 to-amber-500';
    return 'from-emerald-500 to-teal-600';
  };

  const getOccupancyBadgeColor = (pct: number) => {
    if (pct >= 90) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (pct >= 75) return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  };

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
        isSelected
          ? 'bg-emerald-50/40 border-[#006747] ring-2 ring-[#006747]/20 shadow-md'
          : isRecommended
          ? 'bg-white border-[#cfc493] ring-1 ring-[#cfc493]/50 shadow-sm hover:shadow-md'
          : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm'
      }`}
    >
      {/* Top Accent Stripe for Recommended */}
      {isRecommended && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#cfc493] via-[#006747] to-[#cfc493]" />
      )}

      {/* Header: Rank + Facility Name + Walking Time */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex items-center justify-center w-7 h-7 rounded-xl text-xs font-black shadow-sm ${
              isRecommended
                ? 'bg-[#006747] text-white'
                : isSelected
                ? 'bg-[#006747] text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            #{rank}
          </span>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                {facility.name}
              </h3>
              {facility.isCovered && (
                <span
                  title="Covered Multilevel Garage"
                  className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-700 font-bold flex items-center gap-1 border border-slate-200"
                >
                  <Warehouse size={11} className="text-[#006747]" /> Covered
                </span>
              )}
              {facility.features.evCharging && (
                <span
                  title="EV Charging Available"
                  className="px-1.5 py-0.5 rounded-md text-[10px] bg-emerald-50 text-emerald-700 font-bold flex items-center gap-0.5 border border-emerald-200"
                >
                  <Zap size={11} /> EV
                </span>
              )}
              {isPinned && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-emerald-600 text-white font-bold flex items-center gap-1 shadow-sm">
                  <Car size={11} /> My Car
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {facility.type === 'garage'
                ? `${facility.levels} Levels Garage · ${facility.totalCapacity} Total Bays`
                : `Surface Lot · ${facility.totalCapacity} Total Bays`}
            </span>
          </div>
        </div>

        {/* Walking Duration & Distance */}
        <div className="text-right shrink-0">
          <div className="flex items-center justify-end gap-1 text-[#006747] font-black text-sm">
            <Footprints size={15} />
            <span>{walkingTimeMinutes} min walk</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">{estimatedWalkingDistanceMeters}m to class</span>
        </div>
      </div>

      {/* Florida Weather & Sweat Recommendation Badge */}
      {weatherRecommendationBadge && (
        <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <ThermometerSun size={14} className="shrink-0 text-amber-600" />
          <span className="font-medium text-[11px] leading-tight">{weatherRecommendationBadge}</span>
        </div>
      )}

      {/* USF Permit Legality Banner */}
      <div className="mb-3">
        {isLegal ? (
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-medium">
            <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
            <span className="leading-tight">
              {ruleType === 'after-hours'
                ? 'Grace Period: USF After-5:30 PM rule unlocks Staff lot for Students!'
                : legalityReason}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-rose-800 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl font-medium">
            <ShieldAlert size={14} className="shrink-0 text-rose-600" />
            <span className="leading-tight">{legalityReason}</span>
          </div>
        )}
      </div>

      {/* Accurate Live Capacity & Spot Count Meter */}
      <div className="mb-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-600 font-medium">Estimated occupancy:</span>
          <span className={`px-2 py-0.5 rounded-full border text-[11px] font-black ${getOccupancyBadgeColor(currentOccupancyPercentage)}`}>
            {currentOccupancyPercentage}% full ({availableSpotsEstimate} of {facility.totalCapacity} open)
          </span>
        </div>

        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getOccupancyBarColor(
              currentOccupancyPercentage
            )} transition-all duration-500`}
            style={{ width: `${Math.min(100, Math.max(5, currentOccupancyPercentage))}%` }}
          />
        </div>

        {turnoverNotes && (
          <div className="mt-2 text-[11px] text-slate-600 font-medium flex items-center justify-between">
            <span>{turnoverNotes}</span>
          </div>
        )}

        {/* Level-by-Level Accordion for Garages */}
        {levels && levels.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowLevels(!showLevels);
              }}
              className="text-[11px] font-bold text-[#006747] hover:text-[#004c34] flex items-center justify-between w-full"
            >
              <span className="flex items-center gap-1">
                <Layers size={12} />
                <span>Level-by-Level Breakdown ({levels.length} Floors)</span>
              </span>
              {showLevels ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showLevels && (
              <div className="grid grid-cols-2 gap-1.5 mt-2 pt-1">
                {levels.map((lvl) => (
                  <div
                    key={lvl.levelNumber}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-[10px]"
                  >
                    <span className="font-bold text-slate-700">{lvl.levelName}</span>
                    <span
                      className={`font-black ${
                        lvl.status === 'full'
                          ? 'text-rose-600'
                          : lvl.status === 'limited'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {lvl.status === 'full' ? 'FULL' : `${lvl.availableSpots} open`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          {facility.features.bullRunnerStopNearby && (
            <span className="text-[11px] text-sky-700 font-medium flex items-center gap-1">
              <Bus size={12} /> {facility.features.bullRunnerStopNearby.split('-')[0]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPinCar(facility.id);
            }}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
              isPinned
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <Car size={12} />
            <span>{isPinned ? 'Car Pinned' : 'Pin Car'}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 shadow-sm ${
              isSelected
                ? 'bg-[#006747] text-white'
                : 'bg-emerald-50 hover:bg-emerald-100 text-[#006747] border border-[#006747]/30'
            }`}
          >
            <Navigation size={12} />
            <span>{isSelected ? 'Viewing on Map' : 'Show on Map'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
