import React from 'react';
import {
  Bug,
  Clock,
  Flame,
  RefreshCw,
  X,
  Sliders,
  Code
} from 'lucide-react';

interface DebuggerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateTime: (timeString: string | null) => void;
  onToggleRain: (isRaining: boolean) => void;
  onSetTemperature: (temp: number) => void;
  onSetFacilityCapacity: (facilityId: string, percentage: number) => void;
  currentSimulatedTime: string | null;
  isRaining: boolean;
  temperatureF: number;
  rawRoutingResponse: any;
}

export const DebuggerDrawer: React.FC<DebuggerDrawerProps> = ({
  isOpen,
  onClose,
  onSimulateTime,
  onToggleRain,
  onSetTemperature,
  onSetFacilityCapacity,
  currentSimulatedTime,
  isRaining,
  temperatureF,
  rawRoutingResponse
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] max-w-full bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-[#006747] text-white shadow-sm">
            <Bug size={18} />
          </span>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              USF Intelligence Simulator
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">Real-time state & scenario emulator</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Scenario 1: USF Time Machine (Permit Grace & Turnover) */}
        <div className="space-y-2.5">
          <div className="font-extrabold text-[#006747] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Clock size={14} /> Time Machine (Simulate Campus Rush & Turnover)
          </div>
          <p className="text-[11px] text-slate-600 font-medium">
            Active Clock: <strong className="text-slate-900">{currentSimulatedTime ? new Date(currentSimulatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live Real-Time Clock'}</strong>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSimulateTime('2026-10-21T10:48:00')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left transition-all"
            >
              <div className="font-bold text-emerald-800">10:48 AM Class Bell</div>
              <div className="text-[10px] text-slate-500">Massive spot clearing surge</div>
            </button>

            <button
              onClick={() => onSimulateTime('2026-10-21T13:45:00')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-left transition-all"
            >
              <div className="font-bold text-amber-800">1:45 PM Peak Density</div>
              <div className="text-[10px] text-slate-500">Garages exceed 92% cap</div>
            </button>

            <button
              onClick={() => onSimulateTime('2026-10-21T17:45:00')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-[#006747] text-left transition-all"
            >
              <div className="font-bold text-[#006747]">5:45 PM USF Grace Rule</div>
              <div className="text-[10px] text-slate-500">Unlocks Lot 8A & 38A for Students!</div>
            </button>

            <button
              onClick={() => onSimulateTime(null)}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={12} className="text-[#006747]" />
              <span className="font-bold text-slate-700">Reset Live Clock</span>
            </button>
          </div>
        </div>

        {/* Scenario 2: Florida Weather & Sweat Index Tester */}
        <div className="space-y-2.5 pt-3 border-t border-slate-200">
          <div className="font-extrabold text-[#006747] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Flame size={14} /> Florida Weather & Sweat Tester
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onToggleRain(false);
                onSetTemperature(98);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                !isRaining && temperatureF >= 95
                  ? 'bg-amber-50 border-amber-400 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="font-bold">98°F Tampa Scorcher</div>
              <div className="text-[10px]">Heat index 108°F (Favors covered lots)</div>
            </button>

            <button
              onClick={() => {
                onToggleRain(true);
                onSetTemperature(78);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isRaining
                  ? 'bg-blue-50 border-blue-400 text-blue-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="font-bold">Tropical Downpour</div>
              <div className="text-[10px]">Forces covered walkways / garages</div>
            </button>

            <button
              onClick={() => {
                onToggleRain(false);
                onSetTemperature(72);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                !isRaining && temperatureF <= 75
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="font-bold">72°F Pleasant Breeze</div>
              <div className="text-[10px]">Low sweat penalty (Walks rewarded)</div>
            </button>

            <button
              onClick={() => {
                onToggleRain(false);
                onSetTemperature(89);
              }}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-slate-600"
            >
              <div className="font-bold text-slate-900">Default Tampa (89°F)</div>
              <div className="text-[10px]">Typical sunny humidity</div>
            </button>
          </div>
        </div>

        {/* Scenario 3: Real-Time Facility Capacity Override Slider */}
        <div className="space-y-2.5 pt-3 border-t border-slate-200">
          <div className="font-extrabold text-[#006747] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Sliders size={14} /> Simulate Lot Jamming / Freeing
          </div>
          <p className="text-[11px] text-slate-500">
            Adjust occupancy percentages to trigger multimodal Bull Runner fallback or lot diversion:
          </p>

          <div className="space-y-2.5">
            {[
              { id: 'lot-crescent-garage', name: 'Crescent Hill Garage' },
              { id: 'lot-beard-garage', name: 'Beard Garage' },
              { id: 'lot-collins-garage', name: 'Collins Garage' },
              { id: 'lot-43', name: 'Lot 43 (Park & Ride)' }
            ].map((lot) => (
              <div key={lot.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between text-[11px] mb-1 font-bold text-slate-800">
                  <span>{lot.name}</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onSetFacilityCapacity(lot.id, 98)}
                      className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300 text-[10px] font-bold"
                    >
                      Jam 98%
                    </button>
                    <button
                      onClick={() => onSetFacilityCapacity(lot.id, 35)}
                      className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 text-[10px] font-bold"
                    >
                      Clear 35%
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scenario 4: Raw JSON Response Inspector */}
        <div className="space-y-2 pt-3 border-t border-slate-200">
          <div className="font-extrabold text-[#006747] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Code size={14} /> Backend Intelligence Payload Inspector
          </div>
          <div className="max-h-48 overflow-y-auto p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[10px] text-emerald-400">
            <pre>{JSON.stringify(rawRoutingResponse, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
