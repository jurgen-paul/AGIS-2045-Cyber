import React, { useState, useMemo } from 'react';
import { 
  Compass, 
  MapPin, 
  Search, 
  ShieldAlert, 
  Radio, 
  Send, 
  Activity, 
  Clock, 
  Layers, 
  CheckCircle2, 
  Flame, 
  RotateCcw,
  Sliders,
  FileText,
  Home,
  Building,
  UserCheck,
  BarChart3,
  TrendingUp,
  Mic
} from 'lucide-react';
import { 
  SubjectIdentity, 
  CrimeIncident, 
  DispatchedLawEnforcementAlert,
  LocatorFilterState 
} from '../../types';
import { CrimeSeekMap } from '../locator/CrimeSeekMap';
import { HazardHeatmapPanel } from '../locator/HazardHeatmapPanel';
import { TrackAndTracePanel } from '../locator/TrackAndTracePanel';
import { FraudDetectorPanel } from '../locator/FraudDetectorPanel';
import { CrimeFrequencyChart } from '../locator/CrimeFrequencyChart';
import { VoiceDispatchConsole } from '../locator/VoiceDispatchConsole';
import { SendAlertModal } from '../locator/SendAlertModal';
import { formatCoordinates } from '../../utils/geoUtils';

interface GlobalLocatorScreenProps {
  subjects: SubjectIdentity[];
  crimes: CrimeIncident[];
  dispatchedAlerts: DispatchedLawEnforcementAlert[];
  onDispatchAlert: (alert: DispatchedLawEnforcementAlert) => void;
}

export function GlobalLocatorScreen({
  subjects,
  crimes,
  dispatchedAlerts,
  onDispatchAlert
}: GlobalLocatorScreenProps) {
  // Navigation active tab inside locator
  const [activeTab, setActiveTab] = useState<'seekmap' | 'hazard_heatmap' | 'voice_dispatch' | 'frequency' | 'tracktrace' | 'fraud' | 'alerts'>('seekmap');

  // Selected entities
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [selectedCrime, setSelectedCrime] = useState<CrimeIncident | null>(null);

  // Send Alert Modal state
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [modalTargetSubject, setModalTargetSubject] = useState<SubjectIdentity | null>(null);
  const [modalTargetCrime, setModalTargetCrime] = useState<CrimeIncident | null>(null);

  // Seek Radius
  const [seekRadiusKm, setSeekRadiusKm] = useState<number>(250);

  // Filter States
  const [filterIdNumber, setFilterIdNumber] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterBirth, setFilterBirth] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterCityVillage, setFilterCityVillage] = useState('');
  const [filterOnlyVillages, setFilterOnlyVillages] = useState(false);
  const [filterMinFraud, setFilterMinFraud] = useState(0);

  // Quick Universal Search at top
  const [quickSearch, setQuickSearch] = useState('');

  // Selected subject object
  const selectedSubject = useMemo(() => {
    return subjects.find((s) => s.id === selectedSubjectId) || subjects[0] || null;
  }, [subjects, selectedSubjectId]);

  // Filter subjects based on all attributes
  const filteredSubjects = useMemo(() => {
    return subjects.filter((subj) => {
      // Universal quick search
      if (quickSearch.trim()) {
        const q = quickSearch.toLowerCase();
        const matchesUniversal =
          subj.fullName.toLowerCase().includes(q) ||
          subj.idNumber.toLowerCase().includes(q) ||
          subj.birthDate.toLowerCase().includes(q) ||
          subj.country.toLowerCase().includes(q) ||
          subj.cityOrVillage.toLowerCase().includes(q) ||
          (subj.aliases && subj.aliases.some((a) => a.toLowerCase().includes(q)));
        if (!matchesUniversal) return false;
      }

      // ID Number filter
      if (filterIdNumber.trim() && !subj.idNumber.toLowerCase().includes(filterIdNumber.toLowerCase())) {
        return false;
      }

      // Name filter
      if (filterName.trim()) {
        const n = filterName.toLowerCase();
        const matchesName =
          subj.fullName.toLowerCase().includes(n) ||
          (subj.aliases && subj.aliases.some((a) => a.toLowerCase().includes(n)));
        if (!matchesName) return false;
      }

      // Birth date filter
      if (filterBirth.trim() && !subj.birthDate.includes(filterBirth.trim())) {
        return false;
      }

      // Country filter
      if (filterCountry.trim() && !subj.country.toLowerCase().includes(filterCountry.toLowerCase())) {
        return false;
      }

      // City / Village filter
      if (filterCityVillage.trim() && !subj.cityOrVillage.toLowerCase().includes(filterCityVillage.toLowerCase())) {
        return false;
      }

      // Only Villages filter
      if (filterOnlyVillages && !subj.isVillage) {
        return false;
      }

      // Min Fraud score filter
      if (subj.fraudRiskScore < filterMinFraud) {
        return false;
      }

      return true;
    });
  }, [
    subjects,
    quickSearch,
    filterIdNumber,
    filterName,
    filterBirth,
    filterCountry,
    filterCityVillage,
    filterOnlyVillages,
    filterMinFraud
  ]);

  // Open alert modal helper
  const handleOpenAlertModal = (subject?: SubjectIdentity, crime?: CrimeIncident) => {
    setModalTargetSubject(subject || selectedSubject || null);
    setModalTargetCrime(crime || null);
    setIsAlertModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Global Search Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-[#111827] to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Compass className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white font-mono tracking-wider uppercase">
                  GLOBAL LOCATOR, TRACK & TRACE SYSTEM
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Multi-Jurisdiction Target Identification • Crime Locations SeekMap • Real-Time Fraud Detector
                </p>
              </div>
            </div>
          </div>

          {/* Quick Universal Omnisearch Bar */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Track & trace by ID number, name, birth date, country, city, or village..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
              />
              {quickSearch && (
                <button
                  onClick={() => setQuickSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-mono"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Primary Quick Alert Action */}
          <div className="shrink-0">
            <button
              onClick={() => handleOpenAlertModal(selectedSubject || undefined)}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-red-950/40 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Alert</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('seekmap')}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'seekmap'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>CRIME SEEKMAP</span>
              <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 text-[10px]">
                {crimes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('hazard_heatmap')}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'hazard_heatmap'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-lg shadow-orange-950/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
              <span>HAZARD HEATMAP</span>
              <span className="px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 text-[10px]">
                D3 DENSITY
              </span>
            </button>

            <button
              onClick={() => setActiveTab('voice_dispatch')}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'voice_dispatch'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-lg shadow-red-950/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Mic className="w-4 h-4 text-red-400 animate-pulse" />
              <span>VOICE DISPATCH</span>
              <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 text-[10px]">
                AUDIO ROUTE
              </span>
            </button>

            <button
              onClick={() => setActiveTab('frequency')}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'frequency'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>INCIDENT FREQUENCY</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                {crimes.length} Cases
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tracktrace')}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'tracktrace'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>TRACK & TRACE DOSSIER</span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px]">
                {filteredSubjects.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('fraud')}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'fraud'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>FRAUD DETECTOR</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                {subjects.filter((s) => s.fraudRiskScore >= 70).length} HIGH
              </span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'alerts'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>DISPATCHED ALERTS</span>
              <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px]">
                {dispatchedAlerts.length}
              </span>
            </button>
          </div>

          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ENCLAVE ZERO-TRUST SYNC: ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Main Dynamic Screen Views */}
      {activeTab === 'seekmap' && (
        <div className="space-y-6">
          <CrimeSeekMap
            subjects={filteredSubjects}
            crimes={crimes}
            selectedSubject={selectedSubject}
            onSelectSubject={(subj) => setSelectedSubjectId(subj.id)}
            selectedCrime={selectedCrime}
            onSelectCrime={setSelectedCrime}
            onOpenSendAlert={handleOpenAlertModal}
            seekRadiusKm={seekRadiusKm}
            onChangeSeekRadius={setSeekRadiusKm}
            onOpenVoiceDispatch={() => setActiveTab('voice_dispatch')}
            onOpenHazardHeatmap={() => setActiveTab('hazard_heatmap')}
          />

          {/* Voice-Guided Dispatch & Audio Route Status Console */}
          <VoiceDispatchConsole
            subjects={filteredSubjects}
            crimes={crimes}
            onDispatchAlert={onDispatchAlert}
            onCenterOnCoordinates={(coords) => {
              // Target coordinates locked
            }}
            onSelectSubject={(subj) => setSelectedSubjectId(subj.id)}
            onSelectCrime={(c) => setSelectedCrime(c)}
          />

          {/* Quick Track & Trace Overview Strip */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  RAPID ENTITY SELECTOR ({filteredSubjects.length} MATCHING QUERIES)
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('tracktrace')}
                className="text-xs text-cyan-400 hover:underline font-mono"
              >
                Open Full Dossier →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSubjects.map((subj) => (
                <div
                  key={subj.id}
                  onClick={() => setSelectedSubjectId(subj.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    selectedSubjectId === subj.id
                      ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{subj.fullName}</span>
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        {subj.idNumber} • {subj.cityOrVillage} {subj.isVillage ? '🏡 (Village)' : '🏢 (City)'}
                      </div>
                    </div>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                      subj.fraudRiskScore >= 80
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {subj.fraudRiskScore}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Crime Incident Frequency Timeline Chart (Recharts) */}
          <CrimeFrequencyChart
            crimes={crimes}
            onSelectCrime={(crime) => {
              setSelectedCrime(crime);
            }}
            onOpenSendAlert={handleOpenAlertModal}
          />
        </div>
      )}

      {activeTab === 'hazard_heatmap' && (
        <div className="space-y-6">
          <HazardHeatmapPanel
            crimes={crimes}
            subjects={filteredSubjects}
            onSelectCrime={(crime) => {
              setSelectedCrime(crime);
              setActiveTab('seekmap');
            }}
            onOpenSendAlert={handleOpenAlertModal}
            onCenterMapCoordinates={(coords) => {
              setActiveTab('seekmap');
            }}
          />
        </div>
      )}

      {activeTab === 'voice_dispatch' && (
        <div className="space-y-6">
          <VoiceDispatchConsole
            subjects={filteredSubjects}
            crimes={crimes}
            onDispatchAlert={onDispatchAlert}
            onCenterOnCoordinates={(coords) => {
              setActiveTab('seekmap');
            }}
            onSelectSubject={(subj) => {
              setSelectedSubjectId(subj.id);
              setActiveTab('tracktrace');
            }}
            onSelectCrime={(crime) => {
              setSelectedCrime(crime);
              setActiveTab('seekmap');
            }}
          />
        </div>
      )}

      {activeTab === 'frequency' && (
        <div className="space-y-6">
          <CrimeFrequencyChart
            crimes={crimes}
            onSelectCrime={(crime) => {
              setSelectedCrime(crime);
              setActiveTab('seekmap');
            }}
            onOpenSendAlert={handleOpenAlertModal}
          />
        </div>
      )}

      {activeTab === 'tracktrace' && (
        <TrackAndTracePanel
          subjects={filteredSubjects}
          selectedSubject={selectedSubject}
          onSelectSubject={(subj) => setSelectedSubjectId(subj.id)}
          onOpenSendAlert={handleOpenAlertModal}
          filterIdNumber={filterIdNumber}
          setFilterIdNumber={setFilterIdNumber}
          filterName={filterName}
          setFilterName={setFilterName}
          filterBirth={filterBirth}
          setFilterBirth={setFilterBirth}
          filterCountry={filterCountry}
          setFilterCountry={setFilterCountry}
          filterCityVillage={filterCityVillage}
          setFilterCityVillage={setFilterCityVillage}
          filterOnlyVillages={filterOnlyVillages}
          setFilterOnlyVillages={setFilterOnlyVillages}
          filterMinFraud={filterMinFraud}
          setFilterMinFraud={setFilterMinFraud}
        />
      )}

      {activeTab === 'fraud' && (
        <FraudDetectorPanel
          subjects={filteredSubjects}
          selectedSubject={selectedSubject}
          onSelectSubject={(subj) => setSelectedSubjectId(subj.id)}
          onOpenSendAlert={handleOpenAlertModal}
        />
      )}

      {activeTab === 'alerts' && (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-400" />
                DISPATCHED LAW ENFORCEMENT ALERTS ARCHIVE
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Cryptographically Signed SIEM / Interpol Red Wire Transmissions
              </p>
            </div>
            <button
              onClick={() => handleOpenAlertModal(selectedSubject || undefined)}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch New Alert</span>
            </button>
          </div>

          {dispatchedAlerts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs">
              No alerts have been dispatched yet.
            </div>
          ) : (
            <div className="space-y-3">
              {dispatchedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                        alert.urgency === 'RED_FLASH_IMMEDIATE'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : alert.urgency === 'FRAUD_FREEZE'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}>
                        {alert.urgency.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {alert.agencyRecipient.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Target: <strong className="text-slate-200">{alert.subjectName}</strong> ({alert.idNumber})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {alert.deliveryStatus}
                      </span>
                      <span className="text-slate-400">{alert.timeFormatted}</span>
                    </div>
                  </div>

                  <div className="text-xs font-mono text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                    <div><strong>Action Required:</strong> {alert.actionRequired}</div>
                    {alert.officerNotes && (
                      <div className="text-slate-400"><strong>Officer Notes:</strong> {alert.officerNotes}</div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                    <span>Locality: {alert.cityOrVillage}, {alert.country} ({formatCoordinates(alert.coordinates)})</span>
                    <span className="text-purple-400 font-semibold">{alert.cryptographicDispatchDigest}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Global Alert Dispatch Modal */}
      <SendAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        subject={modalTargetSubject}
        crime={modalTargetCrime}
        onAlertDispatched={onDispatchAlert}
      />
    </div>
  );
}
