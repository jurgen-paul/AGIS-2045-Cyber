import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Network, 
  KeyRound, 
  Radar, 
  ShieldAlert, 
  Layers, 
  CheckCircle2, 
  CheckSquare, 
  CloudLightning,
  AlertTriangle,
  Server,
  Cpu,
  ShieldOff,
  Lock,
  Flame,
  FileText,
  Bot,
  Compass
} from 'lucide-react';
import { NavigationScreen, PolicyEnforcementLevel, EnclaveLockState } from '../types';

interface SidebarProps {
  currentScreen: NavigationScreen;
  onSelectScreen: (screen: NavigationScreen) => void;
  unmitigatedAlertsCount: number;
  policyLevel: PolicyEnforcementLevel;
  onChangePolicyLevel: (level: PolicyEnforcementLevel) => void;
  enclaveLockState?: EnclaveLockState;
  onGlobalTerminateSession?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onSelectScreen,
  unmitigatedAlertsCount,
  policyLevel,
  onChangePolicyLevel,
  enclaveLockState = 'LOCKED',
  onGlobalTerminateSession
}) => {
  const [justTerminated, setJustTerminated] = useState(false);

  const handleTerminateClick = () => {
    if (onGlobalTerminateSession) {
      onGlobalTerminateSession();
      setJustTerminated(true);
      setTimeout(() => setJustTerminated(false), 3000);
    }
  };

  const navItems: { id: NavigationScreen; label: string; icon: React.FC<any>; badge?: string | number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { 
      id: 'locator', 
      label: 'Locator & Crime SeekMap', 
      icon: Compass, 
      badge: 'SeekMap', 
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40' 
    },
    { id: 'chatbot', label: 'Security Chatbot & Voice', icon: Bot, badge: 'Voice AI', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    { id: 'neural', label: 'Infrastructure & Routing', icon: Network, badge: '5 Hops' },
    { id: 'enclave', label: '512-bit Enclave Vault', icon: KeyRound, badge: 'Kyber' },
    { id: 'radar', label: 'Biometric Radar & Trace', icon: Radar },
    { 
      id: 'shield', 
      label: 'Security Scan & Shield', 
      icon: ShieldAlert, 
      badge: unmitigatedAlertsCount > 0 ? `${unmitigatedAlertsCount} Alerts` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    },
    { id: 'matrix', label: '6-Layer Architecture', icon: Layers },
    { id: 'validation', label: 'Audit & Validations', icon: CheckCircle2, badge: '100%' },
    { id: 'documents', label: 'Security Documents & Proofs', icon: FileText, badge: 'PDF Dossier', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
    { id: 'tasks', label: 'Google Tasks Ops', icon: CheckSquare, badge: 'Synced' },
    { id: 'aws_deploy', label: 'AWS Deployment Suite', icon: CloudLightning, badge: 'PROD', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' }
  ];

  return (
    <aside className="w-full lg:w-64 border-r border-slate-800 bg-[#111827] p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
      <div className="space-y-4">
        {/* Nav Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectScreen(item.id)}
                className={`w-full text-left px-3 py-2 rounded flex items-center justify-between gap-3 text-sm font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`px-2 py-0.5 text-[10px] font-mono rounded border shrink-0 ${item.badgeColor || 'bg-slate-700/50 border-slate-600 text-slate-300'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Security Policy Posture Switcher */}
        <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Policy Level</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              policyLevel === 'STRICT' ? 'bg-rose-500/20 text-rose-300' :
              policyLevel === 'BALANCED' ? 'bg-cyan-500/20 text-cyan-300' :
              'bg-emerald-500/20 text-emerald-300'
            }`}>
              {policyLevel}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {(['STRICT', 'BALANCED', 'DEVELOPMENT'] as PolicyEnforcementLevel[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => onChangePolicyLevel(lvl)}
                className={`py-1 text-[10px] font-mono rounded transition-all cursor-pointer ${
                  policyLevel === lvl
                    ? 'bg-cyan-600 text-white font-bold shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl === 'DEVELOPMENT' ? 'DEV' : lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Global Session Terminate & Emergency Purge */}
        <div className="p-3 bg-rose-950/20 rounded-lg border border-rose-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-rose-400 font-medium flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Enclave State</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              enclaveLockState === 'LOCKED'
                ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
            }`}>
              {enclaveLockState}
            </span>
          </div>

          <button
            id="global-session-terminate-btn"
            onClick={handleTerminateClick}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-semibold tracking-wide transition shadow-sm cursor-pointer group ${
              justTerminated
                ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300'
                : 'bg-rose-950/50 hover:bg-rose-900/70 border border-rose-600/50 hover:border-rose-500 text-rose-300 hover:text-rose-100'
            }`}
            title="Wipe active Enclave session keys, purge volatile memory registers, and reset to fully locked zero-trust state"
          >
            {justTerminated ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Keys Purged & Locked</span>
              </>
            ) : (
              <>
                <ShieldOff className="w-3.5 h-3.5 text-rose-400 group-hover:animate-pulse" />
                <span>Global Session Terminate</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* System Status Block from Design Template */}
      <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">System Status</p>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">CPU Load</span>
            <span className="text-cyan-400 font-mono">12%</span>
          </div>
          <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
            <div className="bg-cyan-500 w-[12%] h-full rounded-full"></div>
          </div>

          <div className="flex justify-between text-xs mt-3">
            <span className="text-slate-400">Storage</span>
            <span className="text-slate-200 font-mono">4.2 / 10 TB</span>
          </div>
          <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
            <div className="bg-slate-400 w-[42%] h-full rounded-full"></div>
          </div>

          <div className="flex justify-between text-xs mt-3">
            <span className="text-slate-400">Enclave Memory</span>
            <span className="text-emerald-400 font-mono">
              {enclaveLockState === 'LOCKED' ? 'Sealed (Locked)' : 'Session Active'}
            </span>
          </div>
          <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
            <div className={`w-[100%] h-full rounded-full ${enclaveLockState === 'LOCKED' ? 'bg-emerald-500' : 'bg-cyan-500'}`}></div>
          </div>
        </div>
      </div>
    </aside>
  );
};

