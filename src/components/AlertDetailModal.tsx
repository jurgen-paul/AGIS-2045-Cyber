import React from 'react';
import { 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  Terminal, 
  ExternalLink, 
  CheckSquare,
  Lock,
  Cpu,
  Trash2,
  Radio
} from 'lucide-react';
import { TelemetryAnomalyAlert } from '../types';

interface AlertDetailModalProps {
  alert: TelemetryAnomalyAlert | null;
  onClose: () => void;
  onMitigate: (alertId: string, actionName: string) => void;
  onPushToTasks: (alert: TelemetryAnomalyAlert) => void;
  onRemoveAlert?: (alertId: string) => void;
  onDispatchRemoteAlert?: (alertId: string) => void;
}

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  alert,
  onClose,
  onMitigate,
  onPushToTasks,
  onRemoveAlert,
  onDispatchRemoteAlert
}) => {
  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl rounded-xl bg-[#1E293B] border border-slate-700 p-6 shadow-2xl relative overflow-hidden text-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className={`p-2.5 rounded-lg border flex-shrink-0 ${
            alert.severity === 'CRITICAL' ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' :
            'bg-amber-500/20 border-amber-500/40 text-amber-400'
          }`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                alert.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {alert.severity} • RISK {(alert.riskScore * 100).toFixed(0)}%
              </span>
              <span className="text-xs text-slate-400">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">{alert.title}</h2>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          {alert.description}
        </p>

        {/* Intercepted Snippet */}
        <div className="mb-4">
          <div className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Intercepted Raw Payload Vector:</span>
            <span className="text-[10px] text-cyan-400 font-mono">Node: {alert.affectedDomainOrNode}</span>
          </div>
          <pre className="p-3 rounded-lg bg-black/40 border border-slate-800 text-xs font-mono text-rose-300/90 overflow-x-auto whitespace-pre-wrap">
            {alert.detectedPayloadSnippet}
          </pre>
        </div>

        {/* Audit Details */}
        <div className="grid grid-cols-2 gap-2 mb-6 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Applied Redaction Rule</span>
            <span className="text-slate-200 font-semibold">{alert.redactionRuleApplied}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Cryptographic Proof Digest</span>
            <span className="text-cyan-400 font-mono font-semibold truncate block">{alert.cryptographicFingerprint}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                onPushToTasks(alert);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Create Google Task</span>
            </button>

            {onDispatchRemoteAlert && (
              <button
                onClick={() => {
                  onDispatchRemoteAlert(alert.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-500/40 transition cursor-pointer"
                title="Send incident telemetry to remote SIEM webhook"
              >
                <Radio className="w-3.5 h-3.5 text-purple-400" />
                <span>Remote Alert</span>
              </button>
            )}

            {onRemoveAlert && (
              <button
                onClick={() => {
                  onRemoveAlert(alert.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/40 transition cursor-pointer"
                title="Permanently purge alert from active memory"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Remove Alert</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!alert.isMitigated ? (
              <>
                <button
                  onClick={() => {
                    onMitigate(alert.id, 'ZERO_TRUST_ISOLATION');
                    onClose();
                  }}
                  className="px-4 py-2 rounded text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm cursor-pointer"
                >
                  Quarantine & Isolate
                </button>
                <button
                  onClick={() => {
                    onMitigate(alert.id, 'FLUSH_BUFFER_RE_SCRUB');
                    onClose();
                  }}
                  className="px-4 py-2 rounded text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm cursor-pointer"
                >
                  Re-Scrub Laplace
                </button>
              </>
            ) : (
              <span className="px-3 py-2 rounded text-xs bg-emerald-900/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Mitigated ({alert.mitigationActionTaken})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
