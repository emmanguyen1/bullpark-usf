import React, { useState } from 'react';
import { SmartDeparturePlan, ClassSession, Building, UserCommutePreferences } from '../types/campus';
import Tesseract from 'tesseract.js';
import {
  Calendar,
  Clock,
  Navigation,
  CheckCircle2,
  MapPin,
  Plus,
  Trash2,
  Upload,
  X,
  Sliders,
  FileText,
  Download,
  Car,
  Image as ImageIcon,
  Clipboard,
  FileSpreadsheet,
  FileCheck2,
  AlertTriangle,
  Footprints
} from 'lucide-react';

interface SchedulePlannerProps {
  departurePlan: SmartDeparturePlan | null;
  schedule: ClassSession[];
  buildings: Building[];
  onSelectBuildingCode: (code: string) => void;
  onRefreshSchedule: () => void;
}

export const SchedulePlanner: React.FC<SchedulePlannerProps> = ({
  departurePlan,
  schedule,
  buildings,
  onSelectBuildingCode,
  onRefreshSchedule
}) => {
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [activeSyncTab, setActiveSyncTab] = useState<'upload' | 'paste' | 'personalize' | 'presets' | 'add'>('upload');

  // File Upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrProgressText, setOcrProgressText] = useState<string>('');

  // Paste Text state
  const [pastedScheduleText, setPastedScheduleText] = useState<string>('');

  // Form states for adding custom course
  const [courseCode, setCourseCode] = useState('COP 4530');
  const [courseName, setCourseName] = useState('Data Structures');
  const [buildingCode, setBuildingCode] = useState('ENG');
  const [room, setRoom] = useState('104');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 3]);
  const [startTime, setStartTime] = useState('11:00');
  const [endTime, setEndTime] = useState('12:15');

  // Commute Personalization states
  const [targetArrivalBuffer, setTargetArrivalBuffer] = useState<number>(10);
  const [walkingPace, setWalkingPace] = useState<'casual' | 'normal' | 'brisk'>('normal');
  const [commuteDriveMinutes, setCommuteDriveMinutes] = useState<number>(15);
  const [departureOriginName, setDepartureOriginName] = useState<string>('Off-Campus Apartment (Fowler Ave)');
  const [prioritizeCoveredRain, setPrioritizeCoveredRain] = useState<boolean>(true);
  const [savedPrefSuccess, setSavedPrefSuccess] = useState(false);

  const toggleDay = (dayNum: number) => {
    if (daysOfWeek.includes(dayNum)) {
      setDaysOfWeek(daysOfWeek.filter((d) => d !== dayNum));
    } else {
      setDaysOfWeek([...daysOfWeek, dayNum].sort());
    }
  };

  const handleApplyPreset = (presetKey: string) => {
    fetch('/api/schedule/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presetKey })
    })
      .then((res) => res.json())
      .then((data) => {
        setUploadStatusMsg(data.message || `Successfully loaded ${presetKey} schedule.`);
        onRefreshSchedule();
        setTimeout(() => {
          setIsSyncModalOpen(false);
          setUploadStatusMsg(null);
        }, 1200);
      })
      .catch((err) => console.error('Error applying preset:', err));
  };

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/schedule/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseCode,
        courseName,
        buildingCode,
        room,
        daysOfWeek,
        startTime,
        endTime
      })
    })
      .then((res) => res.json())
      .then(() => {
        setUploadStatusMsg(`Added ${courseCode} to schedule.`);
        onRefreshSchedule();
        setTimeout(() => {
          setIsSyncModalOpen(false);
          setUploadStatusMsg(null);
        }, 1200);
      })
      .catch((err) => console.error('Error adding course:', err));
  };

  const handleDeleteCourse = (courseId: string) => {
    fetch(`/api/schedule/courses/${courseId}`, {
      method: 'DELETE'
    })
      .then((res) => res.json())
      .then(() => {
        onRefreshSchedule();
      })
      .catch((err) => console.error('Error deleting course:', err));
  };

  // Process Multi-Format File Upload
  const handleProcessFile = async (file: File) => {
    setUploadedFileName(file.name);
    setUploadStatusMsg(null);
    const fileNameLower = file.name.toLowerCase();

    // 1. Image Screenshot Upload (PNG, JPG, JPEG, WEBP, BMP, HEIC) -> Run Client-Side OCR
    if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|heic|gif)$/i.test(fileNameLower)) {
      setIsOcrProcessing(true);
      setOcrProgressText('Scanning screenshot with Optical Character Recognition (OCR)...');
      try {
        const result = await Tesseract.recognize(file, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgressText(`Reading text (${Math.round((m.progress || 0) * 100)}%)...`);
            }
          }
        });

        const extractedText = result.data.text;
        setOcrProgressText('Matching USF courses & classroom buildings...');

        const res = await fetch('/api/schedule/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileContent: extractedText, fileName: file.name, fileType: 'image_ocr' })
        });
        const data = await res.json();
        setUploadStatusMsg(data.message || `Recognized ${data.schedule?.length || 0} classes from screenshot.`);
        onRefreshSchedule();
        setTimeout(() => {
          setIsSyncModalOpen(false);
          setUploadStatusMsg(null);
          setUploadedFileName(null);
        }, 1500);
      } catch (err) {
        console.error('OCR processing error:', err);
        setUploadStatusMsg('Could not read text from image. Please ensure screenshot text is clear.');
      } finally {
        setIsOcrProcessing(false);
      }
      return;
    }

    // 2. Binary Spreadsheet / PDF Document (.XLSX, .XLS, .ODS, .PDF)
    const isBinaryDocument = /\.(xlsx|xls|ods|pdf)$/i.test(fileNameLower);
    if (isBinaryDocument) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return;
        const base64 = dataUrl.split(',')[1] || dataUrl;

        fetch('/api/schedule/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileBase64: base64, fileName: file.name })
        })
          .then((res) => res.json())
          .then((data) => {
            setUploadStatusMsg(data.message || `Successfully imported ${data.schedule?.length || 0} classes.`);
            onRefreshSchedule();
            setTimeout(() => {
              setIsSyncModalOpen(false);
              setUploadStatusMsg(null);
              setUploadedFileName(null);
            }, 1400);
          })
          .catch((err) => {
            console.error('Binary upload error:', err);
            setUploadStatusMsg('Failed to process document file.');
          });
      };
      reader.readAsDataURL(file);
      return;
    }

    // 3. Text-Based Files (.ICS, .CSV, .TSV, .HTML, .TXT, .JSON, .MD, .DOCX)
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      fetch('/api/schedule/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileContent: content, fileName: file.name })
      })
        .then((res) => res.json())
        .then((data) => {
          setUploadStatusMsg(data.message || `Successfully imported ${data.schedule?.length || 0} classes.`);
          onRefreshSchedule();
          setTimeout(() => {
            setIsSyncModalOpen(false);
            setUploadStatusMsg(null);
            setUploadedFileName(null);
          }, 1400);
        })
        .catch((err) => {
          console.error('Text file upload error:', err);
          setUploadStatusMsg('Failed to parse text schedule file.');
        });
    };
    reader.readAsText(file);
  };

  // Submit Freeform Pasted Schedule Text
  const handlePasteSubmit = () => {
    if (!pastedScheduleText.trim()) return;

    fetch('/api/schedule/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileContent: pastedScheduleText, fileName: 'pasted_schedule.txt' })
    })
      .then((res) => res.json())
      .then((data) => {
        setUploadStatusMsg(data.message || `Imported ${data.schedule?.length || 0} classes from pasted text.`);
        onRefreshSchedule();
        setTimeout(() => {
          setIsSyncModalOpen(false);
          setUploadStatusMsg(null);
          setPastedScheduleText('');
        }, 1400);
      })
      .catch((err) => {
        console.error('Error parsing pasted text:', err);
        setUploadStatusMsg('Failed to parse schedule text.');
      });
  };

  // Download Sample CSV Schedule Template
  const handleDownloadSampleCSV = () => {
    const csvContent =
      'Course Code,Course Name,Building,Room,Days,Start Time,End Time\n' +
      'COP 4530,Data Structures & Algorithms,ENG,104,MW,11:00 AM,12:15 PM\n' +
      'CDA 3103,Computer Organization,CIS,202,TR,02:00 PM,03:15 PM\n' +
      'FIN 3403,Principles of Finance,BSN,1201,TR,09:30 AM,10:45 AM\n' +
      'CHM 2045,General Chemistry I,CHE,100,MWF,08:30 AM,09:20 AM\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'usf_sample_schedule.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save Personalized Commute Preferences
  const handleSavePreferences = () => {
    const payload: Partial<UserCommutePreferences> = {
      targetArrivalBufferMinutes: targetArrivalBuffer,
      walkingPace,
      commuteDriveMinutes,
      departureOriginName,
      prioritizeCoveredIfRain: prioritizeCoveredRain
    };

    fetch('/api/schedule/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then(() => {
        setSavedPrefSuccess(true);
        onRefreshSchedule();
        setTimeout(() => {
          setSavedPrefSuccess(false);
          setIsSyncModalOpen(false);
        }, 1200);
      })
      .catch((err) => console.error('Error saving commute preferences:', err));
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Urgency styling
  const urgency = departurePlan?.urgencyLevel || 'on_track';
  let urgencyPill = {
    label: 'On Track',
    badgeClass: 'bg-emerald-100 text-[#006747] border-emerald-300'
  };
  if (urgency === 'hurry_late') {
    urgencyPill = {
      label: 'Behind Schedule',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300'
    };
  } else if (urgency === 'leave_now') {
    urgencyPill = {
      label: 'Leave Now',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300'
    };
  } else if (urgency === 'prepare_to_leave') {
    urgencyPill = {
      label: 'Prepare to Depart',
      badgeClass: 'bg-sky-100 text-sky-900 border-sky-300'
    };
  }

  return (
    <div className="space-y-4">
      {/* 1. Smart Class Departure Card & Personalized Commute Timeline */}
      {departurePlan && (
        <div className="p-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 shadow-sm space-y-3.5">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="p-1.5 rounded-xl bg-[#006747] text-white shadow-xs">
                <Clock size={14} />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-[#006747]">
                Smart Class Departure Engine
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-xs ${urgencyPill.badgeClass}`}
              >
                {urgencyPill.label}
              </span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#006747] text-white shadow-xs">
                Starts: {departurePlan.classStartTime}
              </span>
            </div>
          </div>

          {/* Course Details & Departure Times Hero */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Target Lecture
                </span>
                {departurePlan.isAlreadyOnCampus ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#006747] text-[10px] font-black border border-emerald-300">
                    Already On Campus (from {departurePlan.previousClassToday?.buildingCode || 'earlier class'})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black border border-blue-200">
                    Off-Campus Commute
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                {departurePlan.classSession.courseCode}: {departurePlan.classSession.courseName}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1 font-medium">
                <MapPin size={13} className="text-[#006747]" />
                <span>
                  <strong className="text-[#006747]">[{departurePlan.classSession.buildingCode}]</strong> Room {departurePlan.classSession.room} · {departurePlan.destinationBuildingName}
                </span>
              </p>
            </div>

            <div className="text-right shrink-0 bg-white/90 p-2.5 rounded-xl border border-emerald-100 shadow-xs">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {departurePlan.isAlreadyOnCampus ? 'Campus Walk Departure' : 'Leave Residence'}
              </div>
              <div className="text-lg font-black text-[#006747]">
                {departurePlan.departureFromOriginTime || departurePlan.recommendedDepartureTime}
              </div>
              <div className="text-[10px] text-slate-500 font-semibold">
                {departurePlan.isAlreadyOnCampus
                  ? `Class Starts: ${departurePlan.classStartTime}`
                  : `Arrive Lot: ${departurePlan.recommendedDepartureTime}`}
              </div>
            </div>
          </div>

          {/* Tight Transfer Warning Banner */}
          {departurePlan.tightTransferWarning && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 font-semibold flex items-start gap-2.5 shadow-xs">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-black text-amber-900">{departurePlan.tightTransferWarning}</div>
                <div className="text-[11px] text-amber-800 mt-0.5 font-medium">
                  Walking transfer on campus between consecutive lectures — vehicle relocation not recommended.
                </div>
              </div>
            </div>
          )}

          {/* Floor & Capacity Guidance Banner */}
          {departurePlan.recommendedFloorGuidance && !departurePlan.isAlreadyOnCampus && (
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs shadow-xs flex items-center justify-between gap-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Car size={14} className="text-[#006747]" />
                <span>{departurePlan.recommendedFloorGuidance}</span>
              </span>
              <span className="text-[11px] text-slate-500 font-semibold whitespace-nowrap">
                ~{departurePlan.estimatedParkingSearchMinutes}m park buffer
              </span>
            </div>
          )}

          {/* Alert Banner */}
          <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 font-semibold flex items-center justify-between gap-2">
            <span>{departurePlan.alertBanner}</span>
            <span className="text-slate-500 text-[11px] whitespace-nowrap font-medium">
              ({departurePlan.bufferMinutes}m in-seat buffer)
            </span>
          </div>

          {/* Step-by-Step Chronological Commute Timeline */}
          {departurePlan.timeline && departurePlan.timeline.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold uppercase tracking-wider">
                <span>Personalized Commute Schedule</span>
                <button
                  onClick={() => {
                    setActiveSyncTab('personalize');
                    setIsSyncModalOpen(true);
                  }}
                  className="text-[#006747] hover:underline flex items-center gap-1 normal-case text-xs font-black"
                >
                  <Sliders size={12} />
                  <span>Personalize Time</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5 text-xs">
                {departurePlan.timeline.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-[11px] font-black text-[#006747]">{step.time}</div>
                      <div className="font-extrabold text-[11px] text-slate-900 mt-0.5">{step.event}</div>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                      {step.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Class Sequence & Campus Walk Transfers Chain */}
          {departurePlan.dayScheduleChain && departurePlan.dayScheduleChain.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-emerald-100">
              <div className="flex items-center justify-between text-[11px] text-slate-700 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Footprints size={13} className="text-[#006747]" />
                  <span>Today's Class Sequence & Campus Transfers ({departurePlan.dayScheduleChain.length} Classes)</span>
                </span>
                <span className="text-[10px] font-normal text-slate-500 normal-case">
                  Prior, current, and upcoming classes
                </span>
              </div>

              <div className="space-y-2">
                {departurePlan.dayScheduleChain.map((item, idx) => {
                  const isCurrent = item.status === 'current_or_next';
                  const isCompleted = item.status === 'completed';

                  return (
                    <div key={item.classSession.id || idx} className="space-y-2">
                      <div
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isCurrent
                            ? 'bg-emerald-50/90 border-[#006747] ring-1 ring-[#006747] shadow-xs'
                            : isCompleted
                            ? 'bg-slate-50 border-slate-200 opacity-80'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`p-1.5 rounded-lg border text-xs font-black ${
                              isCurrent
                                ? 'bg-[#006747] text-white border-[#006747]'
                                : isCompleted
                                ? 'bg-slate-200 text-slate-600 border-slate-300'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 size={13} className="text-emerald-700" />
                            ) : isCurrent ? (
                              <Navigation size={13} />
                            ) : (
                              <Clock size={13} />
                            )}
                          </span>

                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-black text-xs ${
                                  isCurrent ? 'text-[#006747]' : 'text-slate-900'
                                }`}
                              >
                                {item.classSession.courseCode}
                              </span>
                              <span className="text-[11px] text-slate-600 font-medium truncate max-w-[180px] sm:max-w-none">
                                {item.classSession.courseName}
                              </span>
                              {isCurrent && (
                                <span className="px-2 py-0.2 rounded-full bg-[#006747] text-white text-[9px] font-black uppercase">
                                  Current Target
                                </span>
                              )}
                              {isCompleted && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 text-[9px] font-bold">
                                  Dismissed
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium flex-wrap">
                              <span className="text-[#006747] font-black">
                                [{item.classSession.buildingCode}]
                              </span>
                              <span>Room {item.classSession.room}</span>
                              <span>·</span>
                              <span className="text-slate-700">{item.buildingName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-bold text-slate-900">
                            {item.classSession.startTime} - {item.classSession.endTime}
                          </div>
                          <button
                            onClick={() => onSelectBuildingCode(item.classSession.buildingCode)}
                            className="text-[10px] text-[#006747] font-bold hover:underline flex items-center justify-end gap-1 mt-0.5"
                          >
                            <Navigation size={10} /> View Building
                          </button>
                        </div>
                      </div>

                      {/* Inter-Class Campus Walking Transfer Indicator */}
                      {item.transitionToNext && (
                        <div className="flex items-center justify-center py-1">
                          <div
                            className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold flex items-center gap-2 shadow-xs ${
                              item.transitionToNext.isTightTransfer
                                ? 'bg-amber-50 border-amber-300 text-amber-900 font-black'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <Footprints
                              size={12}
                              className={
                                item.transitionToNext.isTightTransfer
                                  ? 'text-amber-600 animate-pulse'
                                  : 'text-slate-500'
                              }
                            />
                            <span>
                              {item.transitionToNext.walkingMinutes} min walk ({item.transitionToNext.walkingDistanceMeters}m)
                            </span>
                            <span className="text-slate-400">·</span>
                            <span>{item.transitionToNext.timeGapMinutes}m break gap</span>
                            {item.transitionToNext.isTightTransfer && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[9px] font-black uppercase">
                                Tight Transfer
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Route Action Button */}
          <button
            onClick={() => onSelectBuildingCode(departurePlan.classSession.buildingCode)}
            className="w-full py-2.5 px-4 rounded-xl bg-[#006747] hover:bg-[#004c34] text-white font-black text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Navigation size={14} />
            Route to Recommended Parking for {departurePlan.classSession.buildingCode}
          </button>
        </div>
      )}

      {/* 2. Course Schedule Roster Card */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-[#006747] border border-emerald-200">
              <Calendar size={14} />
            </span>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Active Course Schedule ({schedule.length} Classes)
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveSyncTab('personalize');
                setIsSyncModalOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all border border-slate-200 flex items-center gap-1"
              title="Personalize walking speed and arrival buffer"
            >
              <Sliders size={12} className="text-[#006747]" />
              <span className="hidden sm:inline">Personalize</span>
            </button>

            <button
              onClick={() => {
                setActiveSyncTab('upload');
                setIsSyncModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#006747] hover:bg-[#004c34] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Upload size={12} />
              <span>Import / Upload File</span>
            </button>
          </div>
        </div>

        {schedule.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            No classes currently scheduled. Click Import / Upload to import your Canvas, Excel, PDF, or screenshot schedule.
          </div>
        ) : (
          <div className="space-y-2">
            {schedule.map((course) => (
              <div
                key={course.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20 transition-all flex items-center justify-between gap-3 group"
              >
                <div
                  onClick={() => onSelectBuildingCode(course.buildingCode)}
                  className="cursor-pointer flex-1"
                >
                  <div className="font-extrabold text-xs text-slate-900 group-hover:text-[#006747] transition-colors">
                    {course.courseCode} · {course.courseName}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium flex-wrap">
                    <span>Building:</span>
                    <span className="text-[#006747] font-black">[{course.buildingCode}]</span>
                    <span>Room {course.room}</span>
                    <span>·</span>
                    <span className="text-slate-600">
                      {course.daysOfWeek.map((d) => dayNames[d]).join(', ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-slate-900 block">
                      {course.startTime} - {course.endTime}
                    </span>
                    <button
                      onClick={() => onSelectBuildingCode(course.buildingCode)}
                      className="text-[10px] text-[#006747] font-bold hover:underline flex items-center justify-end gap-1 mt-0.5"
                    >
                      <Navigation size={10} /> Route
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove class"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Universal Multi-Format Import, Upload, & Commute Personalization Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-[620px] max-w-full shadow-2xl p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-50 text-[#006747] border border-emerald-200 shadow-xs">
                  <Calendar size={18} />
                </span>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Import Class Schedule
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Supports Excel (.xlsx), PDF, Canvas (.ics), Screenshots (OCR), CSV, and Text
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsSyncModalOpen(false);
                  setUploadStatusMsg(null);
                  setUploadedFileName(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-slate-100 rounded-xl p-1 gap-1 text-xs font-bold flex-wrap">
              <button
                onClick={() => setActiveSyncTab('upload')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg transition-all ${
                  activeSyncTab === 'upload' ? 'bg-white text-[#006747] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload Any File
              </button>
              <button
                onClick={() => setActiveSyncTab('paste')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg transition-all ${
                  activeSyncTab === 'paste' ? 'bg-white text-[#006747] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paste Text / Syllabus
              </button>
              <button
                onClick={() => setActiveSyncTab('personalize')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg transition-all ${
                  activeSyncTab === 'personalize' ? 'bg-white text-[#006747] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Personalize Time
              </button>
              <button
                onClick={() => setActiveSyncTab('presets')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg transition-all ${
                  activeSyncTab === 'presets' ? 'bg-white text-[#006747] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                USF Presets
              </button>
              <button
                onClick={() => setActiveSyncTab('add')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg transition-all ${
                  activeSyncTab === 'add' ? 'bg-white text-[#006747] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Add Class
              </button>
            </div>

            {/* Status Message */}
            {uploadStatusMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 size={14} className="text-[#006747]" />
                <span>{uploadStatusMsg}</span>
              </div>
            )}

            {/* OCR Progress Indicator */}
            {isOcrProcessing && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-bold flex items-center gap-3 animate-pulse">
                <div className="w-5 h-5 rounded-full border-2 border-[#006747] border-t-transparent animate-spin" />
                <span>{ocrProgressText}</span>
              </div>
            )}

            {/* TAB 1: UNIVERSAL MULTI-FORMAT FILE UPLOADER */}
            {activeSyncTab === 'upload' && (
              <div className="space-y-3.5 text-xs">
                {/* Supported Formats Pill Bar */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-600">
                  <span className="font-bold text-slate-700">Supported:</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[#006747] font-bold border border-emerald-200 flex items-center gap-1">
                    <FileSpreadsheet size={10} /> Excel (.xlsx, .xls)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200 flex items-center gap-1">
                    <Calendar size={10} /> Canvas (.ics)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-200 flex items-center gap-1">
                    <FileText size={10} /> PDF Documents
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold border border-purple-200 flex items-center gap-1">
                    <ImageIcon size={10} /> Screenshots (OCR)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold border border-amber-200 flex items-center gap-1">
                    <FileCheck2 size={10} /> CSV / TSV / HTML
                  </span>
                </div>

                {/* Drag & Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleProcessFile(file);
                  }}
                  className={`p-7 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#006747] bg-emerald-50/50 scale-[0.99]'
                      : 'border-slate-300 hover:border-[#006747] bg-slate-50 hover:bg-emerald-50/20'
                  }`}
                  onClick={() => {
                    const input = document.getElementById('universal-schedule-file-input');
                    input?.click();
                  }}
                >
                  <input
                    id="universal-schedule-file-input"
                    type="file"
                    accept=".ics,.ical,.csv,.tsv,.xlsx,.xls,.ods,.pdf,.png,.jpg,.jpeg,.webp,.bmp,.txt,.docx,.doc,.rtf,.html,.htm,.json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProcessFile(file);
                    }}
                  />
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-[#006747] shadow-xs mb-2">
                    <Upload size={22} />
                  </div>
                  <div className="font-extrabold text-sm text-slate-800">
                    {uploadedFileName ? `Processing ${uploadedFileName}...` : 'Click to Browse Any File or Drag & Drop'}
                  </div>
                  <p className="text-slate-500 mt-1">
                    Upload your schedule as an Excel spreadsheet, PDF registration matrix, Canvas calendar, photo/screenshot, or text document.
                  </p>
                </div>

                {/* CSV Download Template Helper */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-[#006747]" />
                    <span className="text-slate-600 font-medium">Prefer an Excel or CSV template?</span>
                  </div>
                  <button
                    onClick={handleDownloadSampleCSV}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 font-bold text-[#006747] text-xs flex items-center gap-1 shadow-xs"
                  >
                    <Download size={12} />
                    <span>Download Template</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: PASTE FREEFORM TEXT / SYLLABUS / OASIS TABLE */}
            {activeSyncTab === 'paste' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600 font-medium">
                  Copy and paste your schedule text from an email, Canvas page, USF OASIS portal, or syllabus. Our parser automatically identifies courses, classroom buildings, rooms, meeting days, and times:
                </p>

                <textarea
                  rows={6}
                  value={pastedScheduleText}
                  onChange={(e) => setPastedScheduleText(e.target.value)}
                  placeholder={`Example text:\nCOP 4530 Data Structures & Algorithms ENG 104 MW 11:00 AM - 12:15 PM\nCDA 3103 Computer Organization CIS 202 TR 02:00 PM - 03:15 PM\nMAC 2311 Calculus I ISA 1051 MWF 09:00 AM - 09:50 AM`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-mono text-xs outline-none focus:border-[#006747] focus:bg-white transition-colors"
                />

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500">
                    Supports OASIS tables, tabular copy-pastes, and syllabus snippets.
                  </span>
                  <button
                    type="button"
                    onClick={handlePasteSubmit}
                    disabled={!pastedScheduleText.trim()}
                    className="px-4 py-2 rounded-xl bg-[#006747] hover:bg-[#004c34] text-white font-bold text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm shrink-0"
                  >
                    <Clipboard size={13} />
                    <span>Parse & Import Schedule</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: PERSONALIZE COMMUTE & TIME TO PARK */}
            {activeSyncTab === 'personalize' && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 font-medium">
                  Configure your exact walking pace, origin drive time, and target classroom arrival buffer so BullPark calculates departure times where you are <strong>never late to class</strong>.
                </p>

                {/* Arrival Buffer Selector */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="font-bold text-slate-800 block flex items-center justify-between">
                    <span>Target Early Arrival at Classroom Desk:</span>
                    <span className="text-[#006747] font-black">{targetArrivalBuffer} minutes early</span>
                  </label>
                  <div className="flex gap-1.5">
                    {[5, 10, 15, 20, 25].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setTargetArrivalBuffer(mins)}
                        className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                          targetArrivalBuffer === mins
                            ? 'bg-[#006747] text-white border-[#006747] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    Allows time to settle into your seat, unpack laptop/notes, and chat with professor.
                  </span>
                </div>

                {/* Walking Pace Selector */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="font-bold text-slate-800 block flex items-center justify-between">
                    <span>Walking Pace Preference:</span>
                    <span className="text-[#006747] font-black uppercase tracking-wider">{walkingPace}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setWalkingPace('casual')}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        walkingPace === 'casual'
                          ? 'bg-emerald-50 border-[#006747] text-[#006747] font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="font-extrabold text-xs">Casual</div>
                      <div className="text-[10px] text-slate-500">~2.5 mph (Relaxed walk)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWalkingPace('normal')}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        walkingPace === 'normal'
                          ? 'bg-emerald-50 border-[#006747] text-[#006747] font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="font-extrabold text-xs">Normal</div>
                      <div className="text-[10px] text-slate-500">~3.0 mph (Standard pace)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWalkingPace('brisk')}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        walkingPace === 'brisk'
                          ? 'bg-emerald-50 border-[#006747] text-[#006747] font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="font-extrabold text-xs">Brisk</div>
                      <div className="text-[10px] text-slate-500">~3.7 mph (Power walk)</div>
                    </button>
                  </div>
                </div>

                {/* Commute Origin & Drive Time */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="font-bold text-slate-800 block">Commute Origin / Residence:</label>
                  <select
                    value={departureOriginName}
                    onChange={(e) => {
                      setDepartureOriginName(e.target.value);
                      if (e.target.value.includes('Fowler')) setCommuteDriveMinutes(15);
                      else if (e.target.value.includes('Bruce B Downs')) setCommuteDriveMinutes(20);
                      else if (e.target.value.includes('Dorm')) setCommuteDriveMinutes(0);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold outline-none cursor-pointer"
                  >
                    <option value="Off-Campus Apartment (Fowler Ave)">Fowler Ave Area (~15 min drive)</option>
                    <option value="North Tampa (Bruce B Downs)">Bruce B Downs / New Tampa (~20 min drive)</option>
                    <option value="USF Campus Dorm / Residence Hall">On-Campus Dorm (0 min drive / Walk only)</option>
                    <option value="South Tampa / Downtown">Downtown / South Tampa (~25 min drive)</option>
                    <option value="Custom Origin">Custom Origin</option>
                  </select>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-slate-600 font-medium">Estimated Drive Minutes:</span>
                    <input
                      type="number"
                      min={0}
                      max={90}
                      value={commuteDriveMinutes}
                      onChange={(e) => setCommuteDriveMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 font-black text-slate-900 text-center outline-none"
                    />
                  </div>
                </div>

                {/* Covered Parking in Rain Preference */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900">Prioritize Covered Parking in Rain</div>
                    <div className="text-[11px] text-slate-500">Automatically routes to Beard, Collins, or Laurel Garage if Tampa rains</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prioritizeCoveredRain}
                    onChange={(e) => setPrioritizeCoveredRain(e.target.checked)}
                    className="w-4 h-4 accent-[#006747] cursor-pointer"
                  />
                </div>

                {/* Save Button */}
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#006747] hover:bg-[#004c34] text-white font-black text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <CheckCircle2 size={14} />
                  <span>{savedPrefSuccess ? 'Saved Preferences!' : 'Save Commute Preferences & Recalculate'}</span>
                </button>
              </div>
            )}

            {/* TAB 4: USF DEGREE PRESETS */}
            {activeSyncTab === 'presets' && (
              <div className="space-y-2.5 text-xs">
                <p className="text-slate-600 font-medium">
                  Select an official USF student course roster for instant testing:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => handleApplyPreset('cs_engineering')}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-[#006747] text-left transition-all"
                  >
                    <div className="font-extrabold text-slate-900 text-xs">Computer Science & Engineering</div>
                    <div className="text-[11px] text-slate-500 mt-1">ENG, CIS, PHY, CPR</div>
                    <span className="text-[10px] text-[#006747] font-bold mt-1.5 inline-block">Load Roster →</span>
                  </button>

                  <button
                    onClick={() => handleApplyPreset('business_finance')}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-[#006747] text-left transition-all"
                  >
                    <div className="font-extrabold text-slate-900 text-xs">Muma College of Business</div>
                    <div className="text-[11px] text-slate-500 mt-1">FIN, ACG, MAR in BSN</div>
                    <span className="text-[10px] text-[#006747] font-bold mt-1.5 inline-block">Load Roster →</span>
                  </button>

                  <button
                    onClick={() => handleApplyPreset('pre_med_stem')}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-[#006747] text-left transition-all"
                  >
                    <div className="font-extrabold text-slate-900 text-xs">Pre-Med & Biomedical Sciences</div>
                    <div className="text-[11px] text-slate-500 mt-1">CHE, ISA, BEH</div>
                    <span className="text-[10px] text-[#006747] font-bold mt-1.5 inline-block">Load Roster →</span>
                  </button>

                  <button
                    onClick={() => handleApplyPreset('honors_liberal')}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-[#006747] text-left transition-all"
                  >
                    <div className="font-extrabold text-slate-900 text-xs">Honors & Liberal Arts</div>
                    <div className="text-[11px] text-slate-500 mt-1">JPN, SOC, CPR</div>
                    <span className="text-[10px] text-[#006747] font-bold mt-1.5 inline-block">Load Roster →</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: ADD CUSTOM CLASS */}
            {activeSyncTab === 'add' && (
              <form onSubmit={handleAddCourse} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-600 block mb-1 font-bold">Course Code</label>
                    <input
                      type="text"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      placeholder="e.g. COP 4530"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium outline-none focus:border-[#006747]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-bold">Course Title</label>
                    <input
                      type="text"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="e.g. Data Structures"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium outline-none focus:border-[#006747]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-600 block mb-1 font-bold">Classroom Building</label>
                    <select
                      value={buildingCode}
                      onChange={(e) => setBuildingCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold outline-none cursor-pointer focus:border-[#006747]"
                    >
                      {buildings.map((bldg) => (
                        <option key={bldg.id} value={bldg.code}>
                          [{bldg.code}] {bldg.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-bold">Room Number</label>
                    <input
                      type="text"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      placeholder="e.g. 104"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium outline-none focus:border-[#006747]"
                      required
                    />
                  </div>
                </div>

                {/* Days of Week */}
                <div>
                  <label className="text-slate-600 block mb-1 font-bold">Meeting Days</label>
                  <div className="flex gap-1">
                    {[
                      { num: 1, name: 'M' },
                      { num: 2, name: 'T' },
                      { num: 3, name: 'W' },
                      { num: 4, name: 'R' },
                      { num: 5, name: 'F' },
                      { num: 6, name: 'S' }
                    ].map((d) => (
                      <button
                        key={d.num}
                        type="button"
                        onClick={() => toggleDay(d.num)}
                        className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                          daysOfWeek.includes(d.num)
                            ? 'bg-[#006747] text-white border-[#006747]'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-600 block mb-1 font-bold">Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-[#006747]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-bold">End Time</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-[#006747]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#006747] hover:bg-[#004c34] text-white font-black text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Plus size={14} />
                  <span>Add Class to My Schedule</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
