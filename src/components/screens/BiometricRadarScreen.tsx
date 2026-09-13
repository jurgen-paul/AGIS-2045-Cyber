import React, { useState } from 'react';
import { 
  Radar as RadarIcon, 
  Eye, 
  Mic, 
  User, 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  LocateFixed, 
  Crosshair,
  Volume2,
  Footprints,
  Sparkles
} from 'lucide-react';
import { 
  RadarTarget, 
  SubjectIdentity, 
  FacialRecognitionScan, 
  VoiceprintRecognitionScan, 
  ShadowSilhouetteScan, 
  FootstepsGaitScan 
} from '../../types';

interface BiometricRadarScreenProps {
  targets: RadarTarget[];
  subjects: SubjectIdentity[];
  onLockTarget: (targetId: string) => void;
}

export const BiometricRadarScreen: React.FC<BiometricRadarScreenProps> = ({
  targets,
  subjects,
  onLockTarget
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string>(targets[0]?.id || 'TARGET-01');
  const [activeModalSensor, setActiveModalSensor] = useState<'facial' | 'voice' | 'silhouette' | 'gait'>('facial');

  const selectedTarget = targets.find(t => t.id === selectedTargetId) || targets[0];
  const matchedSubject = subjects.find(s => s.id === selectedTarget?.matchedSubjectId) || subjects[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
              PERIMETER SURVEILLANCE & MULTI-MODAL RECOGNITION
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Track & Trace Radar and Biometric Sensor Mesh
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Real-time polar coordinate target acquisition paired with 4-tier biometric attestation: Facial, Voiceprint, Shadow Silhouette, and Footsteps Seismic Gait.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-cyan-300 bg-slate-800 px-3 py-1.5 rounded border border-slate-700 font-mono flex items-center gap-1.5">
            <LocateFixed className="w-3.5 h-3.5 text-cyan-400" />
            <span>Radar Sweep Active (360°)</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Radar Canvas on Left, Multi-Modal Sensor on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Radar Canvas (7 Cols) */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-[#1E293B] border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RadarIcon className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Photonic Track & Trace Radar Canvas</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">{targets.length} Targets In Perimeter</span>
          </div>

          {/* Polar Radar Visual Container */}
          <div className="relative w-full aspect-square max-h-[380px] rounded-lg bg-black/50 border border-slate-800 overflow-hidden flex items-center justify-center">
            {/* Concentric Polar Range Rings */}
            <div className="absolute w-[25%] aspect-square rounded-full border border-slate-700/60"></div>
            <div className="absolute w-[50%] aspect-square rounded-full border border-slate-700/60"></div>
            <div className="absolute w-[75%] aspect-square rounded-full border border-slate-700/60"></div>
            <div className="absolute w-[95%] aspect-square rounded-full border border-slate-700/70"></div>

            {/* Crosshairs & Angle Lines */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-px bg-slate-700/40"></div>
              <div className="h-full w-px bg-slate-700/40"></div>
              <div className="w-full h-px bg-slate-700/20 rotate-45"></div>
              <div className="w-full h-px bg-slate-700/20 -rotate-45"></div>
            </div>

            {/* Rotating Radar Sweep Beam */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-full animate-radar-sweep opacity-70">
                <div className="w-1/2 h-1/2 ml-auto origin-bottom-left bg-gradient-to-tr from-cyan-500/20 via-cyan-400/5 to-transparent"></div>
              </div>
            </div>

            {/* Target Blips */}
            {targets.map((target) => {
              const isSelected = target.id === selectedTargetId;
              const rad = (target.bearingDegrees - 90) * (Math.PI / 180);
              const maxRange = 700; // max meters
              const normRange = Math.min(target.rangeMeters / maxRange, 0.95);
              const xPercent = 50 + normRange * 45 * Math.cos(rad);
              const yPercent = 50 + normRange * 45 * Math.sin(rad);

              return (
                <div
                  key={target.id}
                  onClick={() => {
                    setSelectedTargetId(target.id);
                    onLockTarget(target.id);
                  }}
                  style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    {isSelected && (
                      <span className="absolute w-8 h-8 rounded-full border border-cyan-400 animate-ping opacity-75"></span>
                    )}
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                      target.threatLevel === 'HOSTILE' ? 'bg-rose-500 border-rose-300 shadow-md' :
                      target.threatLevel === 'FRIENDLY' ? 'bg-emerald-500 border-emerald-300 shadow-md' :
                      target.threatLevel === 'NEUTRAL' ? 'bg-cyan-500 border-cyan-300 shadow-md' :
                      'bg-amber-500 border-amber-300 shadow-md'
                    }`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                  </div>

                  <span className={`absolute top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap ${
                    isSelected ? 'bg-slate-900 border border-cyan-400 text-cyan-200 font-bold' : 'bg-slate-950/80 text-slate-400'
                  }`}>
                    {target.codeName}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Target List Quick Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {targets.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTargetId(t.id);
                  onLockTarget(t.id);
                }}
                className={`p-2.5 rounded-lg border text-left font-mono transition cursor-pointer ${
                  t.id === selectedTargetId
                    ? 'bg-slate-800 border-cyan-400 text-cyan-200 shadow-sm font-semibold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-medium">{t.id}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    t.threatLevel === 'HOSTILE' ? 'bg-rose-500' :
                    t.threatLevel === 'FRIENDLY' ? 'bg-emerald-500' : 'bg-cyan-500'
                  }`}></span>
                </div>
                <div className="text-xs truncate text-white mt-0.5">{t.codeName}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{t.rangeMeters.toFixed(0)}m • {t.bearingDegrees.toFixed(0)}°</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Target Intel & Multi-Modal Biometric Scanner (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Target Identity Intel Card */}
          <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Target Telemetry & Vector Lock</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                selectedTarget.threatLevel === 'HOSTILE' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                selectedTarget.threatLevel === 'FRIENDLY' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}>
                {selectedTarget.threatLevel}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Code:</span>
                <span className="text-white font-bold font-mono">{selectedTarget.codeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Range & Bearing:</span>
                <span className="text-cyan-300 font-mono">{selectedTarget.rangeMeters.toFixed(1)}m @ {selectedTarget.bearingDegrees.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Velocity & Heading:</span>
                <span className="text-slate-200 font-mono">{selectedTarget.velocityKmh.toFixed(1)} km/h • {selectedTarget.headingDegrees.toFixed(0)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Signal Strength:</span>
                <span className="text-emerald-400 font-mono">{selectedTarget.signalStrengthDbm} dBm (Attested)</span>
              </div>
            </div>

            {/* Matched Subject Identity */}
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-700 space-y-1 text-xs">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                Biometric Identity Match:
              </span>
              <div className="flex items-center justify-between">
                <span className="text-white font-bold text-sm">{matchedSubject.fullName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-mono">
                  {matchedSubject.clearanceLevel}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">Affiliation: {matchedSubject.affiliation}</p>
              <div className="text-[10px] text-slate-400 truncate pt-1 border-t border-slate-800 font-mono">
                Vector Hash: {matchedSubject.biometricHash}
              </div>
            </div>
          </div>

          {/* 4-Tier Multi-Modal Biometric Scanner */}
          <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Multi-Modal Biometric Attestation</span>
              </h3>
            </div>

            {/* Sensor Tab Switcher */}
            <div className="grid grid-cols-4 gap-1">
              {[
                { id: 'facial', label: 'Facial', icon: Eye },
                { id: 'voice', label: 'Voice', icon: Mic },
                { id: 'silhouette', label: 'Shadow', icon: User },
                { id: 'gait', label: 'Gait', icon: Footprints }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeModalSensor === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveModalSensor(tab.id as any)}
                    className={`py-2 rounded text-xs flex flex-col items-center gap-1 transition cursor-pointer font-medium ${
                      isActive
                        ? 'bg-slate-800 border border-slate-700 text-cyan-300 font-semibold shadow-sm'
                        : 'bg-slate-900/60 border border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[10px]">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Sensor Details Pane */}
            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
              {activeModalSensor === 'facial' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Match Confidence:</span>
                    <span className="text-emerald-400 font-bold font-mono">{(matchedSubject.facialConfidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pupillary Distance:</span>
                    <span className="text-cyan-300 font-mono">63.5 mm (68 Landmarks)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Liveness & Anti-Spoof:</span>
                    <span className="text-emerald-300 font-semibold">VERIFIED (0.99 Liveness)</span>
                  </div>
                </div>
              )}

              {activeModalSensor === 'voice' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Voiceprint Match:</span>
                    <span className="text-emerald-400 font-bold font-mono">{(matchedSubject.voiceConfidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pitch & Formants:</span>
                    <span className="text-cyan-300 font-mono">142.6 Hz (F1: 520, F2: 1840)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Deepfake AI Synthetic Score:</span>
                    <span className="text-emerald-400 font-semibold font-mono">0.02 (Authentic Human)</span>
                  </div>
                </div>
              )}

              {activeModalSensor === 'silhouette' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Silhouette Match:</span>
                    <span className="text-emerald-400 font-bold font-mono">{(matchedSubject.shadowSilhouetteScore * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Volumetric Symmetry:</span>
                    <span className="text-cyan-300 font-mono">0.95 (Height: 181.4 cm)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Shoulder-to-Hip Ratio:</span>
                    <span className="text-slate-200 font-semibold font-mono">1.38 (Ambient: 120 Lux)</span>
                  </div>
                </div>
              )}

              {activeModalSensor === 'gait' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Seismic Gait Match:</span>
                    <span className="text-emerald-400 font-bold font-mono">{(matchedSubject.footstepsGaitScore * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cadence & Force:</span>
                    <span className="text-cyan-300 font-mono">114 spm • 780.5 N</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Geophone Sensor:</span>
                    <span className="text-emerald-300 font-semibold font-mono">NODE_04 (Resonance: 1.85 Hz)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
