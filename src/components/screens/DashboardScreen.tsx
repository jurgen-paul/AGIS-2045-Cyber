import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Activity, 
  Radio, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  CheckSquare, 
  CloudLightning,
  ChevronRight,
  Fingerprint,
  RefreshCw,
  Zap,
  ArrowUpRight,
  Lock,
  Unlock,
  ShieldAlert,
  Server,
  Terminal,
  Cloud,
  Play,
  Pause,
  Sliders,
  TrendingUp,
  Wifi,
  Download,
  FileText,
  Bot,
  Mic,
  Compass
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { AnomalyDensityHeatmap } from '../AnomalyDensityHeatmap';
import { NeuralTrafficPrediction } from '../NeuralTrafficPrediction';
import { generateSecurityAuditPdfReport } from '../../services/pdfReportGenerator';
import { 
  EnclaveKeyInfo,
  SubAgentThread, 
  TelemetryAnomalyAlert, 
  GoogleTaskItem, 
  ValidationProof,
  NavigationScreen,
  PolicyEnforcementLevel
} from '../../types';

interface PacketTrafficPoint {
  timeLabel: string;
  secondsAgo: number;
  ingressPackets: number;
  sanitizedPackets: number;
  enclaveEncrypted: number;
  quarantinedThreats: number;
  latencyMs: number;
}

interface DashboardScreenProps {
  enclaveKey: EnclaveKeyInfo;
  subAgents: SubAgentThread[];
  alerts: TelemetryAnomalyAlert[];
  tasks: GoogleTaskItem[];
  proofs: ValidationProof[];
  policyLevel: PolicyEnforcementLevel;
  onNavigate: (screen: NavigationScreen) => void;
  onOpenBiometricGate: () => void;
  onSelectAlert: (alert: TelemetryAnomalyAlert) => void;
  onToggleTask: (taskId: string) => void;
  onRotateKey: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  enclaveKey,
  subAgents,
  alerts,
  tasks,
  proofs,
  policyLevel,
  onNavigate,
  onOpenBiometricGate,
  onSelectAlert,
  onToggleTask,
  onRotateKey
}) => {
  const unmitigatedAlerts = alerts.filter(a => !a.isMitigated);
  const openTasks = tasks.filter(t => t.status === 'needsAction');

  // Real-time 60-second rolling packet traffic buffer
  const [isStreaming, setIsStreaming] = useState(true);
  const [trafficProfile, setTrafficProfile] = useState<'NORMAL' | 'BURST' | 'INFILTRATION'>('NORMAL');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    try {
      generateSecurityAuditPdfReport({
        alerts,
        proofs,
        enclaveKey,
        policyLevel,
        tasks
      });
      setExportNotice(`Generated & downloaded PDF audit dossier (${alerts.length} anomalies, ${proofs.length} security proofs).`);
      setTimeout(() => setExportNotice(null), 5000);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setTimeout(() => setIsExportingPdf(false), 600);
    }
  };
  const [visibleSeries, setVisibleSeries] = useState({
    ingress: true,
    sanitized: true,
    enclave: true,
    quarantined: true
  });

  // Seed 60 initial data points (one for each second from -59s to 0s)
  const [trafficData, setTrafficData] = useState<PacketTrafficPoint[]>(() => {
    const now = Date.now();
    const points: PacketTrafficPoint[] = [];
    for (let i = 59; i >= 0; i--) {
      const t = new Date(now - i * 1000);
      const timeLabel = `${t.getMinutes().toString().padStart(2, '0')}:${t.getSeconds().toString().padStart(2, '0')}`;
      
      const baseIngress = 1400 + Math.sin(i / 4) * 200 + (Math.random() * 120 - 60);
      const quarantined = 30 + Math.floor(Math.random() * 25);
      const sanitized = Math.round(baseIngress - quarantined * 0.9);
      const enclave = Math.round(sanitized * 0.94);
      const latency = parseFloat((22 + Math.sin(i / 5) * 3 + Math.random() * 2).toFixed(1));

      points.push({
        timeLabel,
        secondsAgo: i,
        ingressPackets: Math.round(baseIngress),
        sanitizedPackets: sanitized,
        enclaveEncrypted: enclave,
        quarantinedThreats: quarantined,
        latencyMs: latency
      });
    }
    return points;
  });

  // Rolling update effect every 1 second
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeLabel = `${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      // Calculate multiplier based on profile
      const multiplier = trafficProfile === 'BURST' ? 1.75 : trafficProfile === 'INFILTRATION' ? 1.35 : 1.0;
      const threatBoost = trafficProfile === 'INFILTRATION' ? 160 : trafficProfile === 'BURST' ? 65 : 28;

      const randomJitter = (Math.random() * 160 - 80);
      const baseIngress = Math.round((1450 + Math.sin(Date.now() / 4000) * 240 + randomJitter) * multiplier);
      const quarantined = Math.round(threatBoost + (Math.random() * 30));
      const sanitized = Math.max(100, Math.round(baseIngress - quarantined * 0.92));
      const enclave = Math.max(80, Math.round(sanitized * 0.95));
      const latency = parseFloat((23.0 + (trafficProfile === 'BURST' ? 8.5 : 0) + (Math.random() * 3 - 1.5)).toFixed(1));

      const newPoint: PacketTrafficPoint = {
        timeLabel,
        secondsAgo: 0,
        ingressPackets: baseIngress,
        sanitizedPackets: sanitized,
        enclaveEncrypted: enclave,
        quarantinedThreats: quarantined,
        latencyMs: latency
      };

      setTrafficData(prev => {
        const sliced = prev.slice(1);
        return [...sliced, newPoint];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isStreaming, trafficProfile]);

  // Current real-time aggregate stats
  const latestTraffic = trafficData[trafficData.length - 1] || {
    ingressPackets: 1520,
    sanitizedPackets: 1480,
    enclaveEncrypted: 1410,
    quarantinedThreats: 40,
    latencyMs: 24.2
  };

  const avgIngress = useMemo(() => {
    if (trafficData.length === 0) return 0;
    const sum = trafficData.reduce((acc, curr) => acc + curr.ingressPackets, 0);
    return Math.round(sum / trafficData.length);
  }, [trafficData]);

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Operations & PDF Audit Action Banner */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">
                Zero-Trust Cyber-Node Environment
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              512-bit Kyber post-quantum enclave sealed • {alerts.length} session anomalies recorded • {proofs.length} mathematical proofs intact
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('locator')}
            className="px-3.5 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition border border-red-500/40 cursor-pointer shadow-sm"
            title="Open Locator, Track & Trace by ID/Name/Birth/City/Village, Crime SeekMap & Fraud Detector"
          >
            <Compass className="w-3.5 h-3.5 text-red-400 animate-spin-slow" />
            <span>Locator & SeekMap</span>
          </button>

          <button
            onClick={() => onNavigate('chatbot')}
            className="px-3.5 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition border border-purple-500/40 cursor-pointer shadow-sm"
            title="Open Neural Security Chatbot with Voice Talk & Remote SIEM Alerts"
          >
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            <span>Voice Security Assistant</span>
            <Mic className="w-3 h-3 text-cyan-400" />
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm border border-cyan-400/30 cursor-pointer disabled:opacity-50"
            title="Download the current session's anomaly history and cryptographic proofs as a PDF report"
          >
            <Download className={`w-3.5 h-3.5 ${isExportingPdf ? 'animate-bounce' : ''}`} />
            <span>{isExportingPdf ? 'Exporting PDF...' : 'Export Session Audit (PDF)'}</span>
          </button>

          <button
            onClick={() => onNavigate('documents')}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
            title="Open Security Whitepapers, SOC 2, and Compliance Attestation Certificates"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Security Docs & Certs</span>
          </button>
        </div>
      </div>

      {/* Export Feedback Notification */}
      {exportNotice && (
        <div className="p-3 rounded-lg bg-cyan-950/50 border border-cyan-500/40 text-xs text-cyan-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button 
            onClick={() => setExportNotice(null)}
            className="text-cyan-400 hover:text-white font-mono text-[10px] cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* 4 Professional Polish Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {/* Metric 1: EC2 & Container Nodes */}
        <div 
          onClick={() => onNavigate('neural')}
          className="bg-[#1E293B] p-4 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors shadow-sm"
        >
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-medium">EC2 & Mesh Nodes</p>
          <p className="text-2xl font-bold text-white">12 Active</p>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <span>+2 scaled in last 1hr</span>
          </p>
        </div>

        {/* Metric 2: Avg Latency */}
        <div 
          onClick={() => onNavigate('validation')}
          className="bg-[#1E293B] p-4 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors shadow-sm"
        >
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-medium">Avg Latency</p>
          <p className="text-2xl font-bold text-white">24.5ms</p>
          <p className="text-xs text-emerald-400 mt-1">-5% vs yesterday</p>
        </div>

        {/* Metric 3: 512-bit Enclave Posture */}
        <div 
          onClick={() => onNavigate('enclave')}
          className="bg-[#1E293B] p-4 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors shadow-sm"
        >
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-medium">Enclave Status</p>
          <p className={`text-2xl font-bold ${enclaveKey.lockState === 'UNLOCKED_SESSION' ? 'text-emerald-400' : 'text-cyan-400'}`}>
            {enclaveKey.lockState === 'UNLOCKED_SESSION' ? 'Attested' : 'Sealed'}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-mono">{enclaveKey.rotationRemainingSec}s key rotation</p>
        </div>

        {/* Metric 4: Security Threat Risk */}
        <div 
          onClick={() => onNavigate('shield')}
          className="bg-[#1E293B] p-4 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors shadow-sm"
        >
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-medium">Security Risk</p>
          <p className={`text-2xl font-bold ${unmitigatedAlerts.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {unmitigatedAlerts.length > 0 ? `${unmitigatedAlerts.length} Unresolved` : 'Low Risk'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {unmitigatedAlerts.length > 0 ? 'Review Threat Shield' : '0 critical vulnerabilities'}
          </p>
        </div>
      </div>

      {/* Real-Time Cyber Node Packet Traffic Visualizer (Recharts Line Chart) */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-5 space-y-4 shadow-sm">
        {/* Section Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                REAL-TIME TELEMETRY (60S ROLLING BUFFER)
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                <span>{isStreaming ? 'LIVE STREAM' : 'STREAM PAUSED'}</span>
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Cyber Node Packet Traffic & Defense Throughput</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live multi-layer traffic flow across Ingress Gateways, Differential Privacy Sanitizers, Kyber Enclave Encryption, and Threat Quarantines.
            </p>
          </div>

          {/* Interactive Stream & Profile Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Play / Pause Toggle */}
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border ${
                isStreaming
                  ? 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/80'
              }`}
              title={isStreaming ? 'Pause streaming telemetry buffer' : 'Resume real-time telemetry buffer'}
            >
              {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isStreaming ? 'Pause' : 'Resume'}</span>
            </button>

            {/* Profile Selector */}
            <div className="flex items-center bg-slate-900/80 p-0.5 rounded border border-slate-800 text-xs">
              {(['NORMAL', 'BURST', 'INFILTRATION'] as const).map((prof) => (
                <button
                  key={prof}
                  onClick={() => setTrafficProfile(prof)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                    trafficProfile === prof
                      ? prof === 'INFILTRATION'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40 font-bold'
                        : prof === 'BURST'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 font-bold'
                        : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {prof === 'NORMAL' ? 'Normal (1.5k/s)' : prof === 'BURST' ? 'Burst (2.5k/s)' : 'Threat Probe'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Ingress</span>
            <span className="text-lg font-bold font-mono text-cyan-400">
              {latestTraffic.ingressPackets.toLocaleString()} <span className="text-xs font-normal text-slate-400">pkts/s</span>
            </span>
            <span className="text-[10px] text-slate-400 block">60s Avg: {avgIngress.toLocaleString()}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">DP Sanitized Flow</span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              {latestTraffic.sanitizedPackets.toLocaleString()} <span className="text-xs font-normal text-slate-400">pkts/s</span>
            </span>
            <span className="text-[10px] text-emerald-400 block">
              {((latestTraffic.sanitizedPackets / (latestTraffic.ingressPackets || 1)) * 100).toFixed(1)}% clean pass
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Enclave Encrypted</span>
            <span className="text-lg font-bold font-mono text-indigo-400">
              {latestTraffic.enclaveEncrypted.toLocaleString()} <span className="text-xs font-normal text-slate-400">pkts/s</span>
            </span>
            <span className="text-[10px] text-indigo-300 block">Kyber-1024 / 512-bit</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Quarantined / Filtered</span>
            <span className="text-lg font-bold font-mono text-rose-400">
              {latestTraffic.quarantinedThreats.toLocaleString()} <span className="text-xs font-normal text-slate-400">pkts/s</span>
            </span>
            <span className="text-[10px] text-rose-300 block">0.00% zero-day bypass</span>
          </div>
        </div>

        {/* Recharts Chart Container */}
        <div className="h-[280px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trafficData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis 
                dataKey="timeLabel" 
                stroke="#64748B" 
                fontSize={10} 
                fontFamily="monospace"
                interval={9}
                tickLine={false}
              />
              <YAxis 
                stroke="#64748B" 
                fontSize={10} 
                fontFamily="monospace"
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as PacketTrafficPoint;
                    return (
                      <div className="p-3 bg-[#0F172A] border border-slate-700 rounded-lg shadow-xl text-xs font-mono space-y-1.5 min-w-[200px]">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                          <span className="text-slate-300 font-bold">{label}</span>
                          <span className="text-slate-400 text-[10px]">{data.secondsAgo === 0 ? 'Now' : `-${data.secondsAgo}s`}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-cyan-400">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Ingress:
                            </span>
                            <span className="font-bold">{data.ingressPackets.toLocaleString()} pkts/s</span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-400">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Sanitized (DP):
                            </span>
                            <span className="font-bold">{data.sanitizedPackets.toLocaleString()} pkts/s</span>
                          </div>
                          <div className="flex justify-between items-center text-indigo-400">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-400"></span> Enclave PQ:
                            </span>
                            <span className="font-bold">{data.enclaveEncrypted.toLocaleString()} pkts/s</span>
                          </div>
                          <div className="flex justify-between items-center text-rose-400">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-400"></span> Quarantined:
                            </span>
                            <span className="font-bold">{data.quarantinedThreats.toLocaleString()} pkts/s</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800 text-[10px]">
                            <span>Hop Latency:</span>
                            <span className="text-slate-200">{data.latencyMs} ms</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="bottom"
                height={30}
                content={() => (
                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono pt-2">
                    <button 
                      onClick={() => setVisibleSeries(s => ({ ...s, ingress: !s.ingress }))}
                      className={`flex items-center gap-1.5 cursor-pointer transition ${visibleSeries.ingress ? 'text-cyan-300 font-semibold' : 'text-slate-500 line-through'}`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                      <span>Raw Ingress</span>
                    </button>
                    <button 
                      onClick={() => setVisibleSeries(s => ({ ...s, sanitized: !s.sanitized }))}
                      className={`flex items-center gap-1.5 cursor-pointer transition ${visibleSeries.sanitized ? 'text-emerald-300 font-semibold' : 'text-slate-500 line-through'}`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                      <span>Sanitized & Filtered</span>
                    </button>
                    <button 
                      onClick={() => setVisibleSeries(s => ({ ...s, enclave: !s.enclave }))}
                      className={`flex items-center gap-1.5 cursor-pointer transition ${visibleSeries.enclave ? 'text-indigo-300 font-semibold' : 'text-slate-500 line-through'}`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                      <span>Enclave Encrypted</span>
                    </button>
                    <button 
                      onClick={() => setVisibleSeries(s => ({ ...s, quarantined: !s.quarantined }))}
                      className={`flex items-center gap-1.5 cursor-pointer transition ${visibleSeries.quarantined ? 'text-rose-300 font-semibold' : 'text-slate-500 line-through'}`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                      <span>Quarantined Threats</span>
                    </button>
                  </div>
                )}
              />
              {visibleSeries.ingress && (
                <Line 
                  type="monotone" 
                  dataKey="ingressPackets" 
                  name="Raw Ingress" 
                  stroke="#38BDF8" 
                  strokeWidth={2} 
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {visibleSeries.sanitized && (
                <Line 
                  type="monotone" 
                  dataKey="sanitizedPackets" 
                  name="Sanitized & Filtered" 
                  stroke="#10B981" 
                  strokeWidth={2} 
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {visibleSeries.enclave && (
                <Line 
                  type="monotone" 
                  dataKey="enclaveEncrypted" 
                  name="Enclave Encrypted" 
                  stroke="#818CF8" 
                  strokeWidth={2} 
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {visibleSeries.quarantined && (
                <Line 
                  type="monotone" 
                  dataKey="quarantinedThreats" 
                  name="Quarantined Threats" 
                  stroke="#F43F5E" 
                  strokeWidth={2} 
                  strokeDasharray="4 2"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Neural Traffic Prediction: Forecasting packet spikes using Simple Moving Average */}
      <NeuralTrafficPrediction recentTraffic={trafficData} />

      {/* D3 Historical Anomaly Density Heatmap over 24 Hours across Cyber Node Domains */}
      <AnomalyDensityHeatmap 
        alerts={alerts}
        onSelectCell={(cell) => {
          if (cell.count > 0 && alerts.length > 0) {
            onSelectAlert(alerts[0]);
          }
        }}
      />

      {/* Main Content Area: Pipeline & Console Output */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Deployment Pipeline & Sub-Agent Swarm */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deployment Pipeline Card */}
          <div className="bg-[#1E293B] rounded-xl border border-slate-800 flex flex-col shadow-sm">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="font-semibold text-slate-200">Deployment Pipeline</h2>
              <span className="text-xs font-mono text-cyan-400">BUILD_ID: AE2045-882</span>
            </div>

            <div className="p-6 flex flex-col gap-6 relative">
              <div className="absolute left-[2.45rem] top-8 bottom-8 w-px bg-slate-700"></div>

              {/* Step 1 */}
              <div className="flex items-start gap-6 relative z-10">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="pt-1">
                  <h3 className="text-white font-medium text-sm">Source Control & Enclave Verification</h3>
                  <p className="text-sm text-slate-400">Commit <span className="font-mono text-slate-300">f8a2bc4</span> by Jurgen Paul (Kyber Signed)</p>
                </div>
                <span className="ml-auto text-xs text-slate-500 font-mono">0.4s</span>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-6 relative z-10">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="pt-1">
                  <h3 className="text-white font-medium text-sm">Optimized Distroless Container Build</h3>
                  <p className="text-sm text-slate-400">Deterministic bundling, tree-shaking & minimal attack surface</p>
                </div>
                <span className="ml-auto text-xs text-slate-500 font-mono">142.2s</span>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-6 relative z-10">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500 flex items-center justify-center text-cyan-400 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></div>
                </div>
                <div className="pt-1">
                  <h3 className="text-white font-medium text-sm">AWS CDK & Nitro Enclave Synthesis</h3>
                  <p className="text-sm text-slate-400">Provisioning VPC, ECS Fargate cluster & AWS WAFv2 rules...</p>
                </div>
                <span className="ml-auto text-xs text-cyan-400 font-mono font-medium">In Progress</span>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-6 opacity-50 relative z-10">
                <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-400 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                </div>
                <div className="pt-1">
                  <h3 className="text-white font-medium text-sm">CloudFront Edge Distribution & DNS</h3>
                  <p className="text-sm text-slate-400">Zero-downtime Blue/Green traffic cutover</p>
                </div>
                <span className="ml-auto text-xs text-slate-600 font-mono">Pending</span>
              </div>
            </div>
          </div>

          {/* 6-Layer Architecture Security Stack */}
          <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">6-Layer Architecture Security Stack</h3>
              </div>
              <button
                onClick={() => onNavigate('matrix')}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Matrix</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { layer: 'Layer 1', name: 'Quantum Glass UI', desc: 'Photonic signals & responsive visual hierarchy', target: 'matrix' },
                { layer: 'Layer 2', name: 'Neural Intent Routing', desc: 'Direct cognitive parsing & domain gates', target: 'neural' },
                { layer: 'Layer 3', name: 'Zero-Trust Pipeline', desc: 'Hardware filters & unidirectional flow', target: 'shield' },
                { layer: 'Layer 4', name: 'Shield Defense Path', desc: 'Prompt injection quarantine & sanitizer', target: 'shield' },
                { layer: 'Layer 5', name: '512-bit PQ Enclave', desc: 'Kyber-1024 dual memory hardware vault', target: 'enclave' },
                { layer: 'Layer 6', name: 'Autonomous Validation', desc: 'Deterministic builds & perimeter proofs', target: 'validation' }
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigate(item.target as NavigationScreen)}
                  className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">{item.layer}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300 transition-colors" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white">{item.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Console Output & Google Tasks Live Ops */}
        <div className="space-y-6">
          {/* Console Output Block from Design Template */}
          <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-4 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-200 text-sm">Console Output</h2>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> LIVE
              </span>
            </div>

            <div className="h-64 bg-black/40 rounded-lg p-3.5 font-mono text-[11px] text-slate-400 leading-relaxed overflow-y-auto space-y-1">
              <div className="text-emerald-400">[INFO] Initializing aegis-deploy-v2.1</div>
              <div>[INFO] Found .aws/config for role jurgen-paul</div>
              <div>[INFO] Starting Docker build engine...</div>
              <div>[DBUG] Container ID: 77a02c91823</div>
              <div className="text-cyan-400">[LOGS] Optimizing production assets...</div>
              <div>[LOGS] gzip compression level 9 applied</div>
              <div>[LOGS] tree-shaking removed 42 unused modules</div>
              <div className="text-amber-400">[WARN] Enclave clock drift &lt; 0.02ms</div>
              <div>[INFO] Pushing image to ECR...</div>
              <div>[INFO] Layer 1: Pushed (sha256:9f83...)</div>
              <div>[INFO] Layer 2: Pushed (sha256:4a12...)</div>
              <div className="text-emerald-400">[PASS] Kyber-1024 hardware key attested</div>
              <div className="flex items-center gap-1 mt-1 text-cyan-400">
                <span>&gt; Streaming kernel telemetry</span>
                <span className="animate-pulse">_</span>
              </div>
            </div>
          </div>

          {/* Active Google Tasks Checklist */}
          <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-200">Google Tasks Ops</h3>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Manage</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {tasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start gap-2.5 text-xs font-mono"
                >
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${
                      task.status === 'completed' 
                        ? 'bg-cyan-600 border-cyan-500 text-white' 
                        : 'border-slate-600 hover:border-cyan-400'
                    }`}
                  >
                    {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {task.title}
                    </p>
                    {task.securityTier && (
                      <span className="text-[10px] text-cyan-400 font-mono">{task.securityTier}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

