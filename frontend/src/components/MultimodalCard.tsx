import React from 'react';
import { Bus, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { MultimodalTransitOption } from '../types/campus';

interface MultimodalCardProps {
  fallback: MultimodalTransitOption;
  onFocusTransitLot?: (lotId: string) => void;
}

export const MultimodalCard: React.FC<MultimodalCardProps> = ({
  fallback,
  onFocusTransitLot
}) => {
  return (
    <div className="p-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white shadow-sm mb-4 relative overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-[#006747] text-white font-black shadow-sm">
            <Bus size={18} />
          </span>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              Smart Transit Option: Bull Runner Shuttle
              <Sparkles size={14} className="text-[#a89a60]" />
            </h4>
            <span className="text-xs text-[#006747] font-bold">Avoid Circling Congested Central Garages!</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-black text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-3 py-1 rounded-full shadow-sm">
          <Clock size={12} />
          <span>~{fallback.totalTimeMinutes}m total trip</span>
        </div>
      </div>

      <p className="text-xs text-slate-600 mb-3 leading-relaxed">
        {fallback.advantageDescription}
      </p>

      {/* 3-Step Transit Visual Timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between shadow-xs">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
            1. Park Hassle-Free
          </div>
          <div className="font-extrabold text-slate-900 mt-1 truncate">
            {fallback.parkLotName.split('(')[0]}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">1,000+ open bays</div>
        </div>

        <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between shadow-xs">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
            2. Board Shuttle
          </div>
          <div className="font-extrabold text-[#006747] mt-1 truncate">
            {fallback.shuttleRouteName}
          </div>
          <div className="text-[11px] text-sky-700 font-bold mt-1">
            Arrives in ~{fallback.shuttleWaitMinutes}m · {fallback.shuttleRideMinutes}m ride
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between shadow-xs">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
            3. Final Stroll
          </div>
          <div className="font-extrabold text-slate-900 mt-1 truncate">
            {fallback.destinationStop.split('(')[0]}
          </div>
          <div className="text-[11px] text-[#006747] font-bold mt-1">
            {fallback.finalWalkMinutes}m stroll directly to class
          </div>
        </div>
      </div>

      {onFocusTransitLot && (
        <div className="mt-3 text-right">
          <button
            onClick={() => onFocusTransitLot(fallback.parkLotId)}
            className="text-xs font-bold text-[#006747] hover:text-[#004c34] underline inline-flex items-center gap-1"
          >
            Show Park & Ride Facility on Map <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
};
