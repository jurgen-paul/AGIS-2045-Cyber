import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Cpu, 
  CheckSquare, 
  Cloud, 
  Fingerprint,
  Radio,
  ExternalLink,
  Bot,
  Mic
} from 'lucide-react';
import { EnclaveLockState, PolicyEnforcementLevel } from '../types';

interface HeaderProps {
  enclaveLock: EnclaveLockState;
  rotationSec: number;
  policyLevel: PolicyEnforcementLevel;
  activeAgentsCount: number;
  gtasksConnected: boolean;
  unmitigatedAlertsCount: number;
  onOpenBiometricGate: () => void;
  onQuickSyncTasks: () => void;
  onNavigate: (screen: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  enclaveLock,
  rotationSec,
  policyLevel,
  activeAgentsCount,
  gtasksConnected,
  unmitigatedAlertsCount,
  onOpenBiometricGate,
  onQuickSyncTasks,
  onNavigate
}) => {
  return (
    <nav className="h-16 border-b border-slate-800 bg-[#1E293B] flex items-center justify-between px-6 shrink-0 z-30 sticky top-0">
      {/* Left: Brand / Logo / Repo */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => onNavigate('dashboard')}
          className="w-8 h-8 bg-cyan-500 hover:bg-cyan-400 rounded flex items-center justify-center transition-colors shadow-sm cursor-pointer"
          title="AEGIS 2045 Dashboard"
        >
          <div className="w-4 h-4 border-2 border-white rotate-45 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </button>

        <span 
          onClick={() => onNavigate('dashboard')}
          className="text-xl font-bold tracking-tight text-white cursor-pointer select-none"
        >
          AEGIS<span className="text-cyan-400">2045</span>
        </span>

        <div className="hidden md:flex items-center ml-4 lg:ml-6 px-3 py-1 bg-slate-700/50 border border-slate-600 rounded text-xs font-mono text-slate-300">
          repo: jurgen-paul/aegis-2045
        </div>
      </div>

      {/* Right: Status Indicators & Quick Actions */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* AWS Production Status Indicator */}
        <button
          onClick={() => onNavigate('aws_deploy')}
          className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-slate-200 transition-colors"
          title="AWS us-east-1 Production Cluster"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>
            AWS us-east-1: <span className="text-emerald-400 font-medium">Production</span>
          </span>
        </button>

        {/* Kyber Enclave Rotation Indicator */}
        <div 
          onClick={() => onNavigate('enclave')}
          className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded text-xs font-mono text-slate-300 cursor-pointer hover:border-slate-600 transition-colors"
          title="512-bit Kyber-1024 Hardware Enclave Rotation"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Kyber-1024:</span>
          <span className={`font-semibold ${rotationSec < 15 ? 'text-amber-400 animate-pulse' : 'text-cyan-400'}`}>
            {rotationSec}s
          </span>
        </div>

        {/* Google Tasks Ops Badge */}
        <button
          onClick={() => onNavigate('tasks')}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition-all ${
            gtasksConnected 
              ? 'bg-slate-800 border-slate-700 text-cyan-300 hover:bg-slate-700/80' 
              : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200'
          }`}
          title="Google Tasks Workspace Sync"
        >
          <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
          <span>Tasks:</span>
          <span className="font-semibold text-slate-200">{gtasksConnected ? 'Synced' : 'Connect'}</span>
        </button>

        {/* Voice AI Security Chatbot Button */}
        <button
          onClick={() => onNavigate('chatbot')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400 transition cursor-pointer"
          title="Open AEGIS Voice AI Security Chatbot Console"
        >
          <Bot className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden md:inline">Voice Chat</span>
          <Mic className="w-3 h-3 text-cyan-400" />
        </button>

        {/* Deploy New Build / Action Button */}
        <button
          onClick={() => onNavigate('aws_deploy')}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition shadow-sm flex items-center gap-1.5"
        >
          <Cloud className="w-4 h-4" />
          <span>Deploy New Build</span>
        </button>

        {/* Enclave Lock / Biometric Attest Trigger */}
        <button
          onClick={onOpenBiometricGate}
          className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-mono font-medium transition-all ${
            enclaveLock === 'UNLOCKED_SESSION'
              ? 'bg-emerald-900/40 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-800/40'
              : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white'
          }`}
          title="FIDO2 Hardware Biometric Attestation Gate"
        >
          {enclaveLock === 'UNLOCKED_SESSION' ? (
            <>
              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Enclave Open</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Attest</span>
            </>
          )}
        </button>
      </div>
    </nav>
  );
};

