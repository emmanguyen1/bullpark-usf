import React, { useState } from 'react';
import { UserProfile, PermitType } from '../types/campus';
import {
  User,
  X,
  Lock,
  Mail,
  CheckCircle2,
  LogOut,
  Sparkles,
  Car,
  Calendar,
  Sliders,
  ChevronRight
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [major, setMajor] = useState('');
  const [permitType, setPermitType] = useState<PermitType>('S');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sign in');

      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error signing in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          studentId,
          major,
          permitType
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');

      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error registering account');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: 'gobulls2026' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Demo login failed');

      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-[#006747] to-[#004c34] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-white/10 text-[#cfc493] border border-white/15">
              <User size={20} />
            </span>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                {currentUser ? 'Your BullPark Profile' : 'USF Student Sign In'}
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                {currentUser
                  ? 'Personalized schedule, permit & parking preferences active'
                  : 'Sync your classes, permit, and personalized departure schedule'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* If Signed In: Profile Overview & Sign Out */}
        {currentUser ? (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#006747] text-[#cfc493] font-black text-lg flex items-center justify-center shadow-sm">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900">{currentUser.name}</h4>
                  <p className="text-xs text-slate-600 font-medium">{currentUser.email}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {currentUser.major || 'Undergraduate Student'} · ID: {currentUser.studentId || 'Active'}
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-[#006747] text-white text-[11px] font-black shadow-xs">
                Permit [{currentUser.permitType}]
              </span>
            </div>

            {/* Saved Account Features & Metrics */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-center text-[#006747] mb-1">
                  <Calendar size={16} />
                </div>
                <div className="font-black text-sm text-slate-900">{currentUser.schedule.length}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Saved Classes</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-center text-[#006747] mb-1">
                  <Car size={16} />
                </div>
                <div className="font-black text-sm text-slate-900">
                  {currentUser.pinnedCarLotId ? 'Parked' : 'None'}
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Pinned Spot</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-center text-[#006747] mb-1">
                  <Sliders size={16} />
                </div>
                <div className="font-black text-sm text-slate-900">
                  {currentUser.commutePreferences?.targetArrivalBufferMinutes || 10}m
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Buffer Time</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-800">Your Commute Settings:</div>
              <div>• Default Origin: <strong>{currentUser.commutePreferences?.departureOriginName || 'Off-Campus'}</strong></div>
              <div>• Walking Pace: <strong>{currentUser.commutePreferences?.walkingPace || 'normal'}</strong></div>
              <div>• Drive to Campus: <strong>~{currentUser.commutePreferences?.commuteDriveMinutes || 15} minutes</strong></div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#006747] hover:bg-[#004c34] text-white font-extrabold text-xs transition-colors shadow-sm text-center"
              >
                Continue to Campus Map
              </button>
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold text-xs transition-colors border border-slate-200 flex items-center gap-1.5"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Tab Switcher */}
            <div className="flex border border-slate-200 rounded-xl p-1 bg-slate-50">
              <button
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  mode === 'signin' ? 'bg-[#006747] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  mode === 'signup' ? 'bg-[#006747] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Quick 1-Click Demo Profiles */}
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <div className="text-[11px] font-bold text-[#006747] uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles size={13} />
                <span>Quick 1-Click Student Login:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickDemoLogin('rocky@usf.edu')}
                  className="p-2 rounded-lg bg-white border border-emerald-200 hover:border-[#006747] text-left transition-all shadow-xs group"
                >
                  <div className="font-extrabold text-slate-900 group-hover:text-[#006747]">Rocky the Bull</div>
                  <div className="text-[10px] text-slate-500">Finance · S Permit · 3 Classes</div>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickDemoLogin('engineer@usf.edu')}
                  className="p-2 rounded-lg bg-white border border-emerald-200 hover:border-[#006747] text-left transition-all shadow-xs group"
                >
                  <div className="font-extrabold text-slate-900 group-hover:text-[#006747]">Alex Rivera</div>
                  <div className="text-[10px] text-slate-500">CS / Engineering · S Permit</div>
                </button>
              </div>
            </div>

            {/* Form */}
            {mode === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    USF Email Address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@usf.edu"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006747] outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006747] outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-[#006747] hover:bg-[#004c34] text-white font-extrabold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>{loading ? 'Signing in…' : 'Sign In to BullPark'}</span>
                  <ChevronRight size={14} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Emma Nguyen"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006747] outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      USF Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@usf.edu"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006747] outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      USF U-Number (Opt)
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="U12345678"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006747] outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Major / Department
                    </label>
                    <input
                      type="text"
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006747] outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      USF Parking Permit
                    </label>
                    <select
                      value={permitType}
                      onChange={(e) => setPermitType(e.target.value as PermitType)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006747] outline-none font-bold cursor-pointer"
                    >
                      <option value="S">S - Student Commuter</option>
                      <option value="R">R - Resident Student</option>
                      <option value="E">E - Staff / Faculty</option>
                      <option value="D">D - Daily Visitor</option>
                      <option value="Y">Y - Park-n-Ride</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006747] outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-[#006747] hover:bg-[#004c34] text-white font-extrabold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>{loading ? 'Creating Account…' : 'Create Student Account'}</span>
                  <CheckCircle2 size={14} />
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
