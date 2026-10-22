import React, { useState } from 'react';
import { BullTradeSpot, BluetoothSignalEvent } from '../types/campus';
import {
  Award,
  Bluetooth,
  Check,
  Radio,
  Send,
  Sparkles,
  Car,
  MapPin,
  CheckCircle2
} from 'lucide-react';

interface BullTradeFeedProps {
  trades: BullTradeSpot[];
  onClaimSpot: (tradeId: string) => void;
  onBroadcastDeparture: (trade: {
    facilityId: string;
    facilityName: string;
    levelOrSection: string;
    spotDescription: string;
    departureInMinutes: number;
    reportedBy: string;
  }) => void;
  onSimulateBluetooth: (eventType: 'DISCONNECTED' | 'CONNECTED', facilityId: string) => void;
  recentTelemetry: BluetoothSignalEvent[];
}

export const BullTradeFeed: React.FC<BullTradeFeedProps> = ({
  trades,
  onClaimSpot,
  onBroadcastDeparture,
  onSimulateBluetooth,
  recentTelemetry
}) => {
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [facilityId, setFacilityId] = useState('lot-crescent-garage');
  const [facilityName, setFacilityName] = useState('Crescent Hill Garage (Garage 4)');
  const [levelOrSection, setLevelOrSection] = useState('Level 3, South Ramp');
  const [spotDescription, setSpotDescription] = useState('Spot 302, Red Civic');
  const [departureMins, setDepartureMins] = useState(4);
  const [studentName, setStudentName] = useState('Alex (CS Commuter)');

  const handleSubmitBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    onBroadcastDeparture({
      facilityId,
      facilityName,
      levelOrSection,
      spotDescription,
      departureInMinutes: departureMins,
      reportedBy: studentName
    });
    setShowBroadcastForm(false);
  };

  const availableTrades = trades.filter((t) => t.status === 'available');
  const claimedTrades = trades.filter((t) => t.status !== 'available');

  return (
    <div className="space-y-4">
      {/* Bull Trade Header Banner */}
      <div className="p-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#006747] text-white shadow-sm font-black">
              <Sparkles size={18} />
            </span>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                Bull Trade: Peer-to-Peer Spot Exchange
                <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  Live
                </span>
              </h4>
              <p className="text-xs text-slate-600 font-medium">
                Coordinate directly with students departing prime campus spots
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowBroadcastForm(!showBroadcastForm)}
            className="px-3 py-1.5 rounded-xl bg-[#006747] hover:bg-[#004c34] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Radio size={14} />
            {showBroadcastForm ? 'Close Form' : 'Broadcast My Spot'}
          </button>
        </div>

        {/* Broadcast Form (Collapsible) */}
        {showBroadcastForm && (
          <form
            onSubmit={handleSubmitBroadcast}
            className="mt-3 p-3.5 rounded-xl bg-white border border-slate-200 space-y-3 text-xs shadow-xs"
          >
            <div className="font-bold text-[#006747] flex items-center gap-1.5 text-xs">
              <Send size={13} /> Leaving campus soon? Pass your spot to a fellow Bull:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Parking Facility</label>
                <select
                  value={facilityId}
                  onChange={(e) => {
                    setFacilityId(e.target.value);
                    setFacilityName(e.target.options[e.target.selectedIndex].text);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none"
                >
                  <option value="lot-crescent-garage">Crescent Hill Garage (Garage 4)</option>
                  <option value="lot-beard-garage">Richard A. Beard Garage (Garage 1)</option>
                  <option value="lot-laurel-garage">Laurel Garage (Garage 2)</option>
                  <option value="lot-collins-garage">Collins Blvd Garage (Garage 6)</option>
                  <option value="lot-23b">Lot 23B (Science Surface)</option>
                  <option value="lot-8a">Lot 8A (Library Surface)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Level / Section</label>
                <input
                  type="text"
                  value={levelOrSection}
                  onChange={(e) => setLevelOrSection(e.target.value)}
                  placeholder="e.g. Level 2, North Ramp"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Vehicle / Spot Description</label>
                <input
                  type="text"
                  value={spotDescription}
                  onChange={(e) => setSpotDescription(e.target.value)}
                  placeholder="e.g. Spot 244, Silver Toyota"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Your Name / Handle</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Alex (CS Commuter)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Departing In (Minutes)</label>
                <select
                  value={departureMins}
                  onChange={(e) => setDepartureMins(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none"
                >
                  <option value={2}>2 minutes (Walking to car now)</option>
                  <option value={5}>5 minutes (Packing bag in class)</option>
                  <option value={10}>10 minutes (Class concluding)</option>
                  <option value={15}>15 minutes</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                <Award size={13} className="text-[#006747]" /> Earns +15 USF Bull Points on verified handoff!
              </span>
              <button
                type="submit"
                className="py-1.5 px-4 rounded-xl bg-[#006747] hover:bg-[#004c34] text-white font-bold text-xs transition-colors shadow-sm"
              >
                Publish Spot Handoff
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Available Spots Feed */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-600 px-1 font-semibold">
          <span>Active Spot Handoffs ({availableTrades.length} ready)</span>
          <span className="text-[#006747] font-bold">Earn Bull Points & Coffee Rewards</span>
        </div>

        {availableTrades.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 shadow-xs">
            No live student broadcasts right now. Be the first to broadcast a departing spot!
          </div>
        ) : (
          availableTrades.map((t) => (
            <div
              key={t.id}
              className="p-3.5 rounded-2xl border border-emerald-300 bg-white hover:border-[#006747] transition-all shadow-xs flex items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Departing in ~{t.departureInMinutes}m
                  </span>
                  <span className="text-xs font-bold text-slate-900">{t.facilityName}</span>
                </div>

                <div className="text-xs text-[#006747] font-bold flex items-center gap-1.5">
                  <MapPin size={13} className="shrink-0" />
                  <span>{t.levelOrSection} — {t.spotDescription}</span>
                </div>

                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                  <span>Reported by: <strong className="text-slate-800">{t.reportedBy}</strong></span>
                  <span>·</span>
                  <span className="text-emerald-700 font-bold">+{t.bullPointsReward} Bull Points</span>
                </div>
              </div>

              <button
                onClick={() => onClaimSpot(t.id)}
                className="shrink-0 py-2 px-3.5 rounded-xl bg-[#006747] hover:bg-[#004c34] text-white font-black text-xs transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Check size={14} /> Claim Spot
              </button>
            </div>
          ))
        )}

        {/* Claimed Trades History */}
        {claimedTrades.map((t) => (
          <div
            key={t.id}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50 opacity-75 flex items-center justify-between text-xs"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Claimed by {t.claimedBy || 'Student'}
                </span>
                <span className="text-slate-500">· {t.facilityName}</span>
              </div>
              <span className="text-[11px] text-slate-500">{t.levelOrSection} ({t.spotDescription})</span>
            </div>
            <span className="text-[11px] text-slate-600 font-bold">Claimed</span>
          </div>
        ))}
      </div>

      {/* Bluetooth Car Disconnect Simulator & Beacon Telemetry */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Bluetooth size={16} />
            </span>
            <div>
              <h5 className="font-extrabold text-xs text-slate-900">
                Automated Car Bluetooth Disconnect Sensor
              </h5>
              <p className="text-[11px] text-slate-500 font-medium">
                Infers when students park or leave without opening the app
              </p>
            </div>
          </div>
        </div>

        {/* Simulator Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => onSimulateBluetooth('DISCONNECTED', 'lot-crescent-garage')}
            className="p-2.5 rounded-xl bg-blue-50/60 hover:bg-blue-50 border border-blue-200 text-blue-900 font-semibold transition-all text-left flex items-center gap-2"
          >
            <Car size={16} className="text-blue-600 shrink-0" />
            <div>
              <div className="font-bold">Simulate Parking (Car Off)</div>
              <div className="text-[10px] text-blue-700">Pins car at Crescent Garage</div>
            </div>
          </button>

          <button
            onClick={() => onSimulateBluetooth('CONNECTED', 'lot-crescent-garage')}
            className="p-2.5 rounded-xl bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold transition-all text-left flex items-center gap-2"
          >
            <Radio size={16} className="text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold">Simulate Leaving (Car On)</div>
              <div className="text-[10px] text-emerald-700">Frees spot to Bull community</div>
            </div>
          </button>
        </div>

        {/* Live Telemetry Stream */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
            Recent Telemetry Signals:
          </span>
          {recentTelemetry.slice(0, 4).map((evt, idx) => (
            <div
              key={idx}
              className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    evt.eventType === 'DISCONNECTED' ? 'bg-blue-500' : 'bg-emerald-500'
                  }`}
                />
                <span className="text-slate-800 font-bold">{evt.facilityName}</span>
                <span className="text-slate-500">({evt.inferredAction})</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{evt.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
