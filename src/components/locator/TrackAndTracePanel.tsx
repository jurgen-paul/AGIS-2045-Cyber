import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Globe, 
  Building, 
  Home, 
  ShieldAlert, 
  UserCheck, 
  Navigation, 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Send, 
  AlertTriangle, 
  Clock, 
  Wifi, 
  CreditCard, 
  Plane, 
  Video, 
  Shield, 
  Anchor,
  Radio,
  Fingerprint
} from 'lucide-react';
import { SubjectIdentity, TrackWaypoint, CheckpointType } from '../../types';
import { formatCoordinates } from '../../utils/geoUtils';

interface TrackAndTracePanelProps {
  subjects: SubjectIdentity[];
  selectedSubject: SubjectIdentity | null;
  onSelectSubject: (subject: SubjectIdentity) => void;
  onOpenSendAlert: (subject: SubjectIdentity) => void;
  filterIdNumber: string;
  setFilterIdNumber: (val: string) => void;
  filterName: string;
  setFilterName: (val: string) => void;
  filterBirth: string;
  setFilterBirth: (val: string) => void;
  filterCountry: string;
  setFilterCountry: (val: string) => void;
  filterCityVillage: string;
  setFilterCityVillage: (val: string) => void;
  filterOnlyVillages: boolean;
  setFilterOnlyVillages: (val: boolean) => void;
  filterMinFraud: number;
  setFilterMinFraud: (val: number) => void;
}

export function TrackAndTracePanel({
  subjects,
  selectedSubject,
  onSelectSubject,
  onOpenSendAlert,
  filterIdNumber,
  setFilterIdNumber,
  filterName,
  setFilterName,
  filterBirth,
  setFilterBirth,
  filterCountry,
  setFilterCountry,
  filterCityVillage,
  setFilterCityVillage,
  filterOnlyVillages,
  setFilterOnlyVillages,
  filterMinFraud,
  setFilterMinFraud
}: TrackAndTracePanelProps) {
  // Route playback simulation state
  const [isPlayingRoute, setIsPlayingRoute] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState<number | null>(null);

  // Active waypoints
  const waypoints = selectedSubject?.trackWaypoints || [];

  // Reset playback when subject changes
  useEffect(() => {
    setIsPlayingRoute(false);
    setPlaybackIndex(null);
  }, [selectedSubject?.id]);

  // Route playback timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingRoute && waypoints.length > 0) {
      timer = setInterval(() => {
        setPlaybackIndex((prev) => {
          if (prev === null || prev >= waypoints.length - 1) {
            setIsPlayingRoute(false);
            return waypoints.length - 1;
          }
          return prev + 1;
        });
      }, 1800);
    }
    return () => clearInterval(timer);
  }, [isPlayingRoute, waypoints.length]);

  // Checkpoint icon selector
  const getCheckpointIcon = (type: CheckpointType) => {
    switch (type) {
      case 'BORDER_CONTROL':
        return <Shield className="w-4 h-4 text-amber-400" />;
      case 'BIOMETRIC_CCTV':
        return <Video className="w-4 h-4 text-cyan-400" />;
      case 'ATM_TRANSACTION':
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'FLIGHT_PASSENGER':
        return <Plane className="w-4 h-4 text-blue-400" />;
      case 'CELLULAR_TOWER':
        return <Wifi className="w-4 h-4 text-purple-400" />;
      case 'MARITIME_PORT':
        return <Anchor className="w-4 h-4 text-indigo-400" />;
      case 'HOTEL_LODGING':
        return <Home className="w-4 h-4 text-orange-400" />;
      default:
        return <MapPin className="w-4 h-4 text-slate-400" />;
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilterIdNumber('');
    setFilterName('');
    setFilterBirth('');
    setFilterCountry('');
    setFilterCityVillage('');
    setFilterOnlyVillages(false);
    setFilterMinFraud(0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Multi-Attribute Track & Trace Filter and Subject List */}
      <div className="lg:col-span-5 space-y-4">
        {/* Search & Filter Header Panel */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white font-mono tracking-wider uppercase">
                TRACK & TRACE QUERY FILTERS
              </h3>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-slate-400 hover:text-cyan-300 font-mono transition cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* ID Number */}
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase">ID / Passport Number</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  placeholder="e.g. NL-892401-K"
                  value={filterIdNumber}
                  onChange={(e) => setFilterIdNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            {/* Name / Aliases */}
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase">Name or Alias</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  placeholder="e.g. Viktor, Restrepo"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            {/* Birth Date */}
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase">Date of Birth (YYYY-MM-DD)</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  placeholder="e.g. 1979-11-03"
                  value={filterBirth}
                  onChange={(e) => setFilterBirth(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase">Country</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  placeholder="e.g. Netherlands, Colombia"
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            {/* City or Village */}
            <div className="sm:col-span-2">
              <label className="text-[10px] font-mono text-slate-400 uppercase">City or Village Location</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  placeholder="e.g. Giethoorn (Village), Guatapé (Village), Berlin (City)"
                  value={filterCityVillage}
                  onChange={(e) => setFilterCityVillage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:border-cyan-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quick Toggles: Village-only & Fraud Score */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterOnlyVillages}
                onChange={(e) => setFilterOnlyVillages(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-300 flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-emerald-400" />
                Only Rural Villages
              </span>
            </label>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Min Fraud Risk:</span>
              <input
                type="range"
                min="0"
                max="90"
                step="10"
                value={filterMinFraud}
                onChange={(e) => setFilterMinFraud(Number(e.target.value))}
                className="w-20 accent-red-500 cursor-pointer"
              />
              <span className="text-red-400 font-bold w-7 text-right">{filterMinFraud}%</span>
            </div>
          </div>
        </div>

        {/* Filtered Subjects List */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                LOCATED SUBJECTS ({subjects.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Click to inspect breadcrumbs
            </span>
          </div>

          {subjects.length === 0 ? (
            <div className="py-8 text-center text-slate-500 font-mono text-xs">
              No subjects matched the specified tracking filters.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {subjects.map((subj) => {
                const isSelected = selectedSubject?.id === subj.id;

                return (
                  <div
                    key={subj.id}
                    onClick={() => onSelectSubject(subj)}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-900/20'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-white">{subj.fullName}</span>
                          {subj.isRedNotice && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                              RED NOTICE
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2">
                          <span className="text-cyan-400 font-semibold">{subj.idNumber}</span>
                          <span>•</span>
                          <span>DOB: {subj.birthDate}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            {subj.isVillage ? <Home className="w-3 h-3 text-emerald-400" /> : <Building className="w-3 h-3 text-blue-400" />}
                            {subj.cityOrVillage}, {subj.country}
                          </span>
                        </div>
                      </div>

                      {/* Fraud badge */}
                      <div className="text-right shrink-0">
                        <div className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${
                          subj.fraudRiskScore >= 80
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : subj.fraudRiskScore >= 50
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {subj.fraudRiskScore}% FRAUD
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block mt-0.5">
                          {subj.trackWaypoints.length} waypoints
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Deep Track & Trace Timeline & Dossier */}
      <div className="lg:col-span-7 space-y-4">
        {selectedSubject ? (
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-xl">
            {/* Dossier Header */}
            <div className="border-b border-slate-800 pb-4 mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-white">{selectedSubject.fullName}</h2>
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {selectedSubject.idNumber}
                  </span>
                  {selectedSubject.isVillage && (
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Home className="w-3 h-3" />
                      Village Resident
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 text-xs font-mono text-slate-400">
                  <span>DOB: <strong className="text-slate-200">{selectedSubject.birthDate}</strong> (Age {selectedSubject.age || 'N/A'})</span>
                  <span>Jurisdiction: <strong className="text-slate-200">{selectedSubject.country}</strong></span>
                  <span>Base Locality: <strong className="text-slate-200">{selectedSubject.cityOrVillage}</strong></span>
                  <span>Clearance: <strong className="text-slate-300">{selectedSubject.clearanceLevel}</strong></span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onOpenSendAlert(selectedSubject)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-2 transition shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Priority Alert</span>
              </button>
            </div>

            {/* Interactive Timeline & Route Controls */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white font-mono uppercase">
                  WAYPOINT BREADCRUMB TIMELINE ({waypoints.length} SIGHTINGS)
                </span>
              </div>

              {/* Play / Step controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsPlayingRoute(!isPlayingRoute)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1 transition cursor-pointer ${
                    isPlayingRoute
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                  }`}
                >
                  {isPlayingRoute ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlayingRoute ? 'Pause Track' : 'Play Track Route'}</span>
                </button>

                <button
                  onClick={() => setPlaybackIndex(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  title="Reset to Full Trail"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chronological Waypoints List */}
            <div className="space-y-3 relative before:absolute before:top-4 before:bottom-4 before:left-4 before:w-0.5 before:bg-slate-800">
              {waypoints.map((wp, index) => {
                const isCurrentInPlayback = playbackIndex !== null && playbackIndex === index;
                const isPassedInPlayback = playbackIndex !== null && index <= playbackIndex;

                return (
                  <div
                    key={wp.id}
                    className={`relative pl-10 transition duration-200 ${
                      playbackIndex !== null && !isPassedInPlayback ? 'opacity-30' : 'opacity-100'
                    }`}
                  >
                    {/* Node Dot */}
                    <div
                      className={`absolute left-2.5 -translate-x-1/2 top-3 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        isCurrentInPlayback
                          ? 'bg-cyan-400 border-white ring-4 ring-cyan-500/30 scale-125'
                          : wp.statusFlag === 'FRAUD_FLAGGED'
                          ? 'bg-red-500 border-slate-900'
                          : wp.statusFlag === 'SUSPICIOUS'
                          ? 'bg-amber-500 border-slate-900'
                          : 'bg-cyan-500 border-slate-900'
                      }`}
                    >
                      <span className="text-[8px] font-mono font-bold text-slate-950">
                        {index + 1}
                      </span>
                    </div>

                    {/* Waypoint Content Card */}
                    <div className={`p-3.5 rounded-xl border transition ${
                      isCurrentInPlayback
                        ? 'bg-cyan-950/30 border-cyan-500/50 shadow-md'
                        : 'bg-slate-900/70 border-slate-800'
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-slate-800 border border-slate-700">
                            {getCheckpointIcon(wp.checkpointType)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                              <span>{wp.locationName}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {wp.checkpointType.replace('_', ' ')}
                              </span>
                              {wp.isVillage ? (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                                  <Home className="w-2.5 h-2.5" />
                                  Village
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-0.5">
                                  <Building className="w-2.5 h-2.5" />
                                  City
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                              <span>{wp.cityOrVillage}, {wp.country}</span>
                              <span>•</span>
                              <span>{formatCoordinates(wp.coordinates)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status pill & Time */}
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            wp.statusFlag === 'FRAUD_FLAGGED'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : wp.statusFlag === 'SUSPICIOUS'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {wp.statusFlag}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                            {wp.timeFormatted}
                          </span>
                        </div>
                      </div>

                      {/* Notes & Telemetry */}
                      <p className="text-xs text-slate-300 mt-2 bg-slate-950/50 p-2 rounded-lg border border-slate-800/60 leading-relaxed font-sans">
                        {wp.notes}
                      </p>

                      <div className="mt-2 text-[10px] font-mono text-slate-400 flex flex-wrap items-center gap-x-4">
                        <span>Identifier: <strong className="text-slate-300">{wp.ipOrImsi}</strong></span>
                        {wp.speedKmh !== undefined && wp.speedKmh > 0 && (
                          <span>Speed: <strong className="text-cyan-300">{wp.speedKmh} km/h</strong></span>
                        )}
                        <span>Precision: <strong className="text-slate-300">±{wp.accuracyMeters}m</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-12 text-center shadow-xl">
            <Fingerprint className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
            <h3 className="text-base font-bold text-white font-mono">NO SUBJECT SELECTED</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-mono">
              Select a subject from the left panel or click any marker on the SeekMap to inspect complete chronological track & trace waypoints.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
