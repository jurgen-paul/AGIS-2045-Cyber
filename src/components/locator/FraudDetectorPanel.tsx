import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Send, 
  Cpu, 
  Activity, 
  FileSearch, 
  RotateCw, 
  Layers, 
  MapPin, 
  Home, 
  Building,
  Fingerprint,
  TrendingUp
} from 'lucide-react';
import { SubjectIdentity, FraudIndicator } from '../../types';

interface FraudDetectorPanelProps {
  subjects: SubjectIdentity[];
  selectedSubject: SubjectIdentity | null;
  onSelectSubject: (subject: SubjectIdentity) => void;
  onOpenSendAlert: (subject: SubjectIdentity) => void;
}

export function FraudDetectorPanel({
  subjects,
  selectedSubject,
  onSelectSubject,
  onOpenSendAlert
}: FraudDetectorPanelProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLog, setScanLog] = useState<string[]>([]);

  // Calculate high-level fraud stats
  const criticalCount = subjects.filter((s) => s.fraudRiskScore >= 80).length;
  const highCount = subjects.filter((s) => s.fraudRiskScore >= 60 && s.fraudRiskScore < 80).length;
  const avgScore = Math.round(
    subjects.reduce((acc, s) => acc + s.fraudRiskScore, 0) / (subjects.length || 1)
  );

  const activeSubject = selectedSubject || subjects[0];

  // Interactive Deep Fraud Scan simulation
  const handleTriggerDeepScan = () => {
    if (!activeSubject) return;
    setIsScanning(true);
    setScanProgress(0);
    setScanLog([
      `[0.0s] Initializing Zero-Trust Enclave Fraud Audit for ID: ${activeSubject.idNumber}...`,
    ]);

    const logs = [
      `[0.4s] Checking ICAO 9303 / Luhn Modulus 10 optical & chip checksums...`,
      `[0.9s] Correlating GPS geodetic velocity between breadcrumbs (max transit 8,850 km)...`,
      `[1.4s] Querying European & national village cadastre registers for ${activeSubject.cityOrVillage}...`,
      `[2.0s] Cross-referencing FinCEN 311 & Chainalysis sanctioned crypto mixer clusters...`,
      `[2.6s] Comparing biometric iris & gait Euclidean vectors against master enclave key...`,
      `[3.0s] Audit complete. Overall Fraud Risk: ${activeSubject.fraudRiskScore}%. Findings sealed.`
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setScanProgress((prev) => Math.min(100, prev + 17));
      if (currentStep < logs.length) {
        setScanLog((prev) => [...prev, logs[currentStep]]);
      } else {
        clearInterval(interval);
        setIsScanning(false);
      }
    }, 450);
  };

  return (
    <div className="space-y-6">
      {/* Top Telemetry Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Monitored Entities</span>
            <Fingerprint className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {subjects.length}
          </div>
          <span className="text-[11px] font-mono text-slate-500 mt-1 block">
            Across global cities & villages
          </span>
        </div>

        <div className="bg-[#111827] border border-red-900/40 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-red-400">
            <span className="text-xs font-mono uppercase">Critical Fraud Score (&gt;80%)</span>
            <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400 mt-1">
            {criticalCount} Entities
          </div>
          <span className="text-[11px] font-mono text-red-400/70 mt-1 block">
            Immediate intercept / freeze warranted
          </span>
        </div>

        <div className="bg-[#111827] border border-amber-900/40 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-mono uppercase">Elevated Risk (60-80%)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {highCount} Entities
          </div>
          <span className="text-[11px] font-mono text-amber-400/70 mt-1 block">
            Active synthetic ID surveillance
          </span>
        </div>

        <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Average Node Fraud Index</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {avgScore}%
          </div>
          <span className="text-[11px] font-mono text-slate-500 mt-1 block">
            Post-quantum anomaly baseline
          </span>
        </div>
      </div>

      {/* Main Fraud Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Entity Selector */}
        <div className="lg:col-span-4 bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                SELECT SUBJECT FOR AUDIT
              </h3>
            </div>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {subjects.map((subj) => {
              const isSelected = activeSubject?.id === subj.id;

              return (
                <div
                  key={subj.id}
                  onClick={() => onSelectSubject(subj)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-red-950/30 border-red-500/60 shadow-md'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{subj.fullName}</span>
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        {subj.idNumber} • {subj.cityOrVillage} {subj.isVillage ? '🏡' : '🏢'}
                      </div>
                    </div>
                    <div className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                      subj.fraudRiskScore >= 80
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : subj.fraudRiskScore >= 50
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {subj.fraudRiskScore}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Fraud Telemetry & Audit Evidence */}
        <div className="lg:col-span-8 space-y-4">
          {activeSubject ? (
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
              {/* Subject Fraud Dossier Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-bold text-white">{activeSubject.fullName}</h2>
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {activeSubject.idNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                      activeSubject.fraudRiskScore >= 80
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : activeSubject.fraudRiskScore >= 50
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}>
                      {activeSubject.fraudLevel} FRAUD RISK
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1 flex flex-wrap items-center gap-x-3">
                    <span>Origin: <strong className="text-slate-200">{activeSubject.country}</strong></span>
                    <span>•</span>
                    <span>Locality: <strong className="text-slate-200">{activeSubject.cityOrVillage} ({activeSubject.isVillage ? 'Rural Village' : 'Metropolitan City'})</strong></span>
                    <span>•</span>
                    <span>DOB: <strong className="text-slate-200">{activeSubject.birthDate}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTriggerDeepScan}
                    disabled={isScanning}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs flex items-center gap-1.5 transition border border-slate-700 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>{isScanning ? 'Auditing...' : 'Run Deep Audit'}</span>
                  </button>

                  <button
                    onClick={() => onOpenSendAlert(activeSubject)}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Fraud Alert</span>
                  </button>
                </div>
              </div>

              {/* Fraud Score Radial Meter & Visual Bar */}
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white font-mono uppercase flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    SYNTHETIC FRAUD PROBABILITY INDEX
                  </span>
                  <span className="text-lg font-bold font-mono text-red-400">
                    {activeSubject.fraudRiskScore}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      activeSubject.fraudRiskScore >= 80
                        ? 'bg-gradient-to-r from-amber-500 to-red-500'
                        : activeSubject.fraudRiskScore >= 50
                        ? 'bg-gradient-to-r from-cyan-500 to-amber-500'
                        : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                    }`}
                    style={{ width: `${activeSubject.fraudRiskScore}%` }}
                  />
                </div>
              </div>

              {/* Deep Scan Live Console (when scan run) */}
              {scanLog.length > 0 && (
                <div className="bg-slate-950 border border-cyan-900/50 p-3.5 rounded-xl font-mono text-xs text-cyan-300 space-y-1 shadow-inner">
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5 mb-1.5">
                    <span className="text-[10px] uppercase">ENCLAVE FRAUD HEURISTIC AUDIT LOG</span>
                    <span className="text-[10px] text-emerald-400">{scanProgress}% COMPLETE</span>
                  </div>
                  {scanLog.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      {log}
                    </div>
                  ))}
                </div>
              )}

              {/* Detected Fraud Indicators List */}
              <div>
                <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  TRIGGERED FRAUD & IDENTITY ANOMALIES ({activeSubject.fraudIndicators.length})
                </h3>

                {activeSubject.fraudIndicators.length === 0 ? (
                  <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-xs font-mono text-slate-300">
                      Zero fraud anomalies flagged. Identity tokens and velocity traces pass all zero-trust criteria.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeSubject.fraudIndicators.map((ind) => (
                      <div
                        key={ind.id}
                        className="bg-slate-900/90 border border-red-900/40 p-3.5 rounded-xl space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                              {ind.code}
                            </span>
                            <span className="text-sm font-bold text-white">{ind.name}</span>
                          </div>
                          <span className="text-xs font-mono text-red-400 font-bold">
                            WEIGHT: {ind.riskWeight}/100
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          {ind.description}
                        </p>
                        <div className="text-[11px] font-mono text-amber-300/90 bg-slate-950/60 p-2 rounded border border-slate-800">
                          <strong>Evidence:</strong> {ind.evidence}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-12 text-center">
              <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white font-mono">NO SUBJECT SELECTED</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
