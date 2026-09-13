import React, { useState } from 'react';
import { 
  Layers, 
  ShieldCheck, 
  Lock, 
  Download, 
  CheckCircle2, 
  Sliders, 
  ChevronDown, 
  ChevronUp,
  FileCode,
  Sparkles
} from 'lucide-react';
import { SecurityPolicyRule, PolicyEnforcementLevel } from '../../types';

interface ArchitectureMatrixScreenProps {
  policyRules: SecurityPolicyRule[];
  policyLevel: PolicyEnforcementLevel;
  onToggleRule: (ruleId: string) => void;
  onChangePolicyLevel: (level: PolicyEnforcementLevel) => void;
  onOpenBiometricGate: () => void;
}

export const ArchitectureMatrixScreen: React.FC<ArchitectureMatrixScreenProps> = ({
  policyRules,
  policyLevel,
  onToggleRule,
  onChangePolicyLevel,
  onOpenBiometricGate
}) => {
  const [expandedLayer, setExpandedLayer] = useState<number | null>(1);

  const layers = [
    {
      id: 1,
      name: 'Quantum Glass Visual System',
      timestamp: '0:55',
      palette: 'Deep Space Cobalt • Volumetric Glass • Photonic Cyan • Ambient White • Operational Emerald • Crimson',
      rule: 'Spatial depth clarifies neural actions without obscuring underlying security posture.',
      details: 'High-contrast light and dark optics paired with micro-refraction indices for zero cognitive friction during defense-grade operations.'
    },
    {
      id: 2,
      name: 'Neural Interaction & Intent Routing',
      timestamp: '1:40',
      palette: 'Real-Time Biometrics & Active Sub-Agent Threads',
      rule: 'Explicit Neural Confirmation Required for sensitive cross-domain state crossings.',
      details: 'Direct intent parsing via Gemini AI models with zero-trust domain boundaries and continuous enclave isolation indicators.'
    },
    {
      id: 3,
      name: 'Hardened System Architecture',
      timestamp: '2:25',
      palette: 'Neural Composery -> Active ViewModel -> Zero-Trust Hardware Filters -> PQ Database -> Egress Gateway',
      rule: 'Unidirectional, immutable state loop rejecting out-of-order mutations with cryptographic hash verification.',
      details: 'Five-tier pipeline ensuring bit-level validation before committing state to hardware enclave memory.'
    },
    {
      id: 4,
      name: 'Shield Protection Path',
      timestamp: '3:25',
      palette: 'Continuous Authentication -> Threat Scanning -> Data Sanitization -> Provenance -> Audit Logging',
      rule: 'Real-time prompt injection heuristics, memory taint guards, and differential privacy (ε = 0.5) enforcement.',
      details: 'Instantaneous Photonic Crimson isolation with automatic incident ledger commits and Google Tasks dispatch.'
    },
    {
      id: 5,
      name: 'Post-Quantum Local Enclave',
      timestamp: '4:30',
      palette: 'Kyber-1024 / Dilithium-5 (512-bit) • Dual Memory Isolation • Secure Hardware eUICC / AWS Nitro HSM',
      rule: 'Keys reside exclusively inside dedicated hardware coprocessors with 60s dynamic rotation.',
      details: 'NIST FIPS 203/204 lattice-based encryption preventing post-quantum cryptanalysis and hardware register snooping.'
    },
    {
      id: 6,
      name: 'Continuous Autonomous Validation',
      timestamp: '5:30',
      palette: 'Deterministic Builds • Schema Migration Proofs • Zero-Leak Network Perimeter Verification',
      rule: 'Mathematical invariant proofs required before autonomous sub-agent orchestration dispatch.',
      details: 'Zero-loss schema integrity verification and reproducible bit-for-bit container artifacts.'
    }
  ];

  const handleDownloadSpec = () => {
    const spec = {
      system_version: 'AGIS-2045',
      codename: 'Quantum Glass',
      architecture_type: 'Zero-Trust Biomorphic Cyber-Node',
      policy_enforcement_level: policyLevel,
      layers,
      active_rules: policyRules
    };
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agis-2045-architecture-matrix-${policyLevel.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
              DEFENSE-GRADE SPECIFICATION MATRIX
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            6-Layer Zero-Trust Cyber-Node Architecture
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Formal architectural blueprints, operational rules, and interactive policy governance engine.
          </p>
        </div>

        <button
          onClick={handleDownloadSpec}
          className="flex items-center gap-2 px-4 py-2 rounded text-xs font-mono font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Blueprint JSON</span>
        </button>
      </div>

      {/* 6 Layers Accordion Matrix */}
      <div className="space-y-3 font-sans">
        {layers.map((layer) => {
          const isExpanded = expandedLayer === layer.id;
          return (
            <div
              key={layer.id}
              className={`rounded-xl border transition-all overflow-hidden ${
                isExpanded ? 'bg-[#1E293B] border-cyan-500/40 shadow-sm' : 'bg-[#1E293B] border-slate-800 hover:border-slate-700'
              }`}
            >
              <button
                onClick={() => setExpandedLayer(isExpanded ? null : layer.id)}
                className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-mono font-bold">
                    LAYER 0{layer.id}
                  </span>
                  <h3 className="text-sm font-semibold text-white">{layer.name}</h3>
                  <span className="hidden sm:inline text-xs font-mono text-slate-500">[{layer.timestamp}]</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-400 font-medium font-mono hidden md:inline">VERIFIED</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 pt-0 border-t border-slate-800 space-y-3 text-xs text-slate-300">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold block uppercase mb-1">Core Mandate & Rule:</span>
                    <p className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-200 leading-relaxed">
                      {layer.rule}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-500 block text-[10px] font-mono mb-0.5">Data Flow / Subsystems:</span>
                      <span className="text-slate-300 font-mono">{layer.palette}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-500 block text-[10px] font-mono mb-0.5">Security Specifications:</span>
                      <span className="text-slate-300">{layer.details}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Interactive Zero-Trust Policy Engine */}
      <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Dynamic Zero-Trust Policy Rules Matrix</h3>
          </div>

          {/* Posture Toggle */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-800 p-1 rounded border border-slate-700 font-mono">
            {(['STRICT', 'BALANCED', 'DEVELOPMENT'] as PolicyEnforcementLevel[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => onChangePolicyLevel(lvl)}
                className={`px-3 py-1 rounded transition-all cursor-pointer ${
                  policyLevel === lvl
                    ? 'bg-cyan-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {policyRules.map((rule) => (
            <div
              key={rule.id}
              className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{rule.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-300 border border-slate-700">
                    {rule.category}
                  </span>
                  {rule.requiresBiometricConfirmation && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      FIDO2 REQUIRED
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">{rule.description}</p>
                <p className="text-[10px] font-mono text-cyan-400">Action: {rule.enforcementAction}</p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => {
                    if (rule.requiresBiometricConfirmation && !rule.isEnabled) {
                      onOpenBiometricGate();
                    } else {
                      onToggleRule(rule.id);
                    }
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
                    rule.isEnabled ? 'bg-cyan-600' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    rule.isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
