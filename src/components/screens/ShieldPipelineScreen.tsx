import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Flame, 
  CheckSquare,
  Lock,
  ArrowRight,
  Filter,
  Network,
  Activity,
  Trash2,
  Radio,
  Share2
} from 'lucide-react';
import { TelemetryAnomalyAlert, TelemetryAnomalyType } from '../../types';
import { AnomalyPropagationDiagram } from '../AnomalyPropagationDiagram';

interface ShieldPipelineScreenProps {
  alerts: TelemetryAnomalyAlert[];
  onSelectAlert: (alert: TelemetryAnomalyAlert) => void;
  onMitigateAlert: (alertId: string, action: string) => void;
  onSimulateAnomaly: (type: TelemetryAnomalyType) => void;
  onPushToTasks: (alert: TelemetryAnomalyAlert) => void;
  onRemoveAlert?: (alertId: string) => void;
  onRemoveAllMitigated?: () => void;
  onDispatchRemoteAlert?: (alertId: string) => void;
}

export const ShieldPipelineScreen: React.FC<ShieldPipelineScreenProps> = ({
  alerts,
  onSelectAlert,
  onMitigateAlert,
  onSimulateAnomaly,
  onPushToTasks,
  onRemoveAlert,
  onRemoveAllMitigated,
  onDispatchRemoteAlert
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [activeView, setActiveView] = useState<'D3_TOPOLOGY' | 'PIPELINE_STAGES'>('D3_TOPOLOGY');

  const pipelineStages = [
    { number: '01', name: 'Continuous Authentication', desc: 'Hardware FIDO2 passkey & lattice attestation', status: 'ACTIVE', color: 'border-cyan-500/40 bg-slate-900/80 text-cyan-300' },
    { number: '02', name: 'Threat Scanning', desc: 'AI prompt injection & adversarial taint heuristics', status: 'INSPECTING', color: 'border-amber-500/40 bg-slate-900/80 text-amber-300' },
    { number: '03', name: 'Data Sanitization', desc: 'Differential privacy Laplace noise (ε=0.5) & PII masking', status: 'SHIELDED', color: 'border-emerald-500/40 bg-slate-900/80 text-emerald-300' },
    { number: '04', name: 'Provenance Tracing', desc: 'Cryptographic SHA-512 immutable hash lineage', status: 'VERIFIED', color: 'border-blue-500/40 bg-slate-900/80 text-blue-300' },
    { number: '05', name: 'Audit Logging', desc: 'Hardware-backed encrypted audit ledger & CloudWatch egress', status: 'SEALED', color: 'border-purple-500/40 bg-slate-900/80 text-purple-300' }
  ];

  const filteredAlerts = alerts.filter(a => {
    if (filterType === 'UNRESOLVED') return !a.isMitigated;
    if (filterType === 'MITIGATED') return a.isMitigated;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Professional Polish */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
              LAYER 4: ZERO-TRUST THREAT SHIELD & TOPOLOGY
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Security Scan & Anomaly Propagation Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time interception of adversarial prompt injections, memory exfiltrations, and differential privacy (<span className="text-cyan-300 font-mono">ε = 0.5</span>) leaks.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex rounded bg-slate-800 p-0.5 border border-slate-700 text-xs font-medium">
            <button
              onClick={() => setActiveView('D3_TOPOLOGY')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition cursor-pointer ${
                activeView === 'D3_TOPOLOGY' ? 'bg-cyan-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>D3 Anomaly Graph</span>
            </button>
            <button
              onClick={() => setActiveView('PIPELINE_STAGES')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition cursor-pointer ${
                activeView === 'PIPELINE_STAGES' ? 'bg-cyan-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>5-Stage Pipeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Visualizer Container */}
      {activeView === 'D3_TOPOLOGY' ? (
        <AnomalyPropagationDiagram
          alerts={alerts}
          onSelectAlert={onSelectAlert}
          onMitigateAlert={onMitigateAlert}
          onSimulateAnomaly={onSimulateAnomaly}
          onPushToTasks={onPushToTasks}
        />
      ) : (
        <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">5-Stage Sequential Shield Protection Path</h3>
            </div>
            <span className="text-xs font-mono text-emerald-400">● 100% Ingress Inspection</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 font-sans">
            {pipelineStages.map((stage, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border relative flex flex-col justify-between ${stage.color}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{stage.number}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border border-current">
                      {stage.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white mb-1">{stage.name}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{stage.desc}</p>
                </div>

                {idx < pipelineStages.length - 1 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Telemetry Threat Incident Log Center */}
      <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-white">Telemetry Anomaly & Threat Audit Center</h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                filterType === 'ALL' ? 'bg-cyan-600 text-white font-medium shadow-sm' : 'text-slate-400 bg-slate-800/60 hover:text-white'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilterType('UNRESOLVED')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                filterType === 'UNRESOLVED' ? 'bg-rose-600 text-white font-medium shadow-sm' : 'text-slate-400 bg-slate-800/60 hover:text-white'
              }`}
            >
              Unresolved ({alerts.filter(a => !a.isMitigated).length})
            </button>
            <button
              onClick={() => setFilterType('MITIGATED')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                filterType === 'MITIGATED' ? 'bg-emerald-600 text-white font-medium shadow-sm' : 'text-slate-400 bg-slate-800/60 hover:text-white'
              }`}
            >
              Mitigated ({alerts.filter(a => a.isMitigated).length})
            </button>

            {onRemoveAllMitigated && alerts.some(a => a.isMitigated) && (
              <button
                onClick={onRemoveAllMitigated}
                className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-[11px] font-mono flex items-center gap-1 transition cursor-pointer"
                title="Purge all mitigated threats from active memory"
              >
                <Trash2 className="w-3 h-3" />
                <span>Purge Mitigated</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border transition-all ${
                !alert.isMitigated 
                  ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60' 
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    alert.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {alert.severity}
                  </span>
                  <span className="font-semibold text-white">{alert.title}</span>
                  <span className="text-slate-500 font-mono text-[11px]">ID: {alert.id}</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">{new Date(alert.timestamp).toLocaleTimeString()}</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">{alert.description}</p>

              {/* Intercepted Snippet */}
              <pre className="p-2.5 rounded bg-black/50 border border-slate-800 text-[11px] font-mono text-rose-300 overflow-x-auto whitespace-pre-wrap mb-3">
                {alert.detectedPayloadSnippet}
              </pre>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
                  <span>Rule: <span className="text-cyan-300">{alert.redactionRuleApplied}</span></span>
                  <span className="text-slate-600">•</span>
                  <span>Node: <span className="text-slate-300">{alert.affectedDomainOrNode}</span></span>
                </div>

                <div className="flex items-center gap-2">
                  {onDispatchRemoteAlert && (
                    <button
                      onClick={() => onDispatchRemoteAlert(alert.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/40 text-purple-300 transition cursor-pointer"
                      title="Dispatch incident to remote SOC / SIEM"
                    >
                      <Radio className="w-3.5 h-3.5 text-purple-400" />
                      <span className="hidden sm:inline">Remote</span>
                    </button>
                  )}

                  <button
                    onClick={() => onPushToTasks(alert)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Sync Task</span>
                  </button>

                  {!alert.isMitigated ? (
                    <button
                      onClick={() => onMitigateAlert(alert.id, 'ZERO_TRUST_ISOLATION')}
                      className="px-3.5 py-1.5 rounded text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm cursor-pointer"
                    >
                      Quarantine Threat
                    </button>
                  ) : (
                    <span className="px-3 py-1 rounded text-[11px] font-mono bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mitigated
                    </span>
                  )}

                  {onRemoveAlert && (
                    <button
                      onClick={() => onRemoveAlert(alert.id)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition cursor-pointer"
                      title="Remove alert from active memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

