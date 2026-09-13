import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Network, 
  Send, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  CheckCircle2, 
  Cpu, 
  RefreshCw,
  ArrowRight,
  Play,
  Pause,
  Radio,
  Share2
} from 'lucide-react';
import { 
  CyberNode, 
  CyberNodeRoute, 
  NeuralIntentPattern, 
  SubAgentThread 
} from '../../types';
import { analyzeNeuralIntent, NeuralAnalysisResult } from '../../services/api';

interface ActiveFlightPacket {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  label: string;
  progress: number;
  duration: number;
  delay: number;
}

interface NeuralCommandScreenProps {
  nodes: CyberNode[];
  routes: CyberNodeRoute[];
  subAgents: SubAgentThread[];
  intents: NeuralIntentPattern[];
  onDispatchIntent: (prompt: string, analysis: NeuralAnalysisResult) => void;
  onOpenBiometricGate: () => void;
}

export const NeuralCommandScreen: React.FC<NeuralCommandScreenProps> = ({
  nodes,
  routes,
  subAgents,
  intents,
  onDispatchIntent,
  onOpenBiometricGate
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedNode, setSelectedNode] = useState<CyberNode | null>(nodes[0] || null);
  const [selectedRoute, setSelectedRoute] = useState<CyberNodeRoute>(routes[0]);
  const [activeAnalysis, setActiveAnalysis] = useState<NeuralAnalysisResult | null>(null);

  // Framer Motion Active Packet Flow States
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchBurstId, setDispatchBurstId] = useState<number>(0);
  const [activePackets, setActivePackets] = useState<ActiveFlightPacket[]>([]);
  const [continuousFlow, setContinuousFlow] = useState<boolean>(true);
  const [arrivedNodeIds, setArrivedNodeIds] = useState<Set<string>>(new Set());
  const [currentHopIndex, setCurrentHopIndex] = useState<number>(-1);

  // Trigger packet dispatch animation across mesh hops
  const triggerPacketFlowAnimation = (customPath?: string[]) => {
    setIsDispatching(true);
    setDispatchBurstId(prev => prev + 1);
    setArrivedNodeIds(new Set());

    // Determine hop sequence from analysis, selected route, or default mesh order
    const hopIds = customPath && customPath.length > 1
      ? customPath
      : ['NODE_01', 'NODE_02', 'NODE_03', 'NODE_04', 'NODE_07'];

    const newPackets: ActiveFlightPacket[] = [];
    const colors = ['#38BDF8', '#34D399', '#818CF8', '#F43F5E', '#FBBF24'];

    for (let i = 0; i < hopIds.length - 1; i++) {
      const srcNode = nodes.find(n => n.id === hopIds[i]) || nodes[i % nodes.length];
      const tgtNode = nodes.find(n => n.id === hopIds[i + 1]) || nodes[(i + 1) % nodes.length];

      const startX = srcNode.normalizedX * 85 + 5;
      const startY = srcNode.normalizedY * 80 + 5;
      const endX = tgtNode.normalizedX * 85 + 5;
      const endY = tgtNode.normalizedY * 80 + 5;

      // Create 2 staggered packets per hop for rich particle visual
      newPackets.push({
        id: `pkt-${Date.now()}-${i}-a`,
        sourceNodeId: srcNode.id,
        targetNodeId: tgtNode.id,
        startX,
        startY,
        endX,
        endY,
        color: colors[i % colors.length],
        label: i === 0 ? 'INTENT_RAW' : i === 1 ? 'DP_CLEANSED' : i === 2 ? 'KYBER_PQ' : 'EGRESS_VERIFIED',
        progress: 0,
        duration: 0.9,
        delay: i * 0.7
      });

      newPackets.push({
        id: `pkt-${Date.now()}-${i}-b`,
        sourceNodeId: srcNode.id,
        targetNodeId: tgtNode.id,
        startX,
        startY,
        endX,
        endY,
        color: colors[(i + 1) % colors.length],
        label: `0x${Math.random().toString(16).substring(2, 6).toUpperCase()}`,
        progress: 0,
        duration: 0.8,
        delay: i * 0.7 + 0.25
      });
    }

    setActivePackets(newPackets);

    // Sequence arrival triggers
    hopIds.forEach((id, idx) => {
      setTimeout(() => {
        setCurrentHopIndex(idx);
        setArrivedNodeIds(prev => new Set([...prev, id]));
      }, idx * 700 + 400);
    });

    // Reset dispatch state after full traversal
    setTimeout(() => {
      setIsDispatching(false);
      setCurrentHopIndex(-1);
    }, (hopIds.length - 1) * 700 + 1200);
  };

  const handleSendPrompt = async () => {
    if (!promptInput.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeNeuralIntent(promptInput);
      setActiveAnalysis(result);
      onDispatchIntent(promptInput, result);

      // Trigger Framer Motion packet visualization with recommended hops
      triggerPacketFlowAnimation(result.recommendedHops);
      setPromptInput('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const presetIntents = [
    { label: 'Rotate Kyber-1024 Keys', prompt: 'Perform 512-bit post-quantum hardware key rotation for eUICC Enclave slot #04.' },
    { label: 'Cross-Domain Sovereign Gate', prompt: 'Request cross-domain mutation between Operator Hub and Protected Egress Gateway.' },
    { label: 'Laplace PII Scrub (ε=0.5)', prompt: 'Sanitize outgoing telemetry flow with differential privacy noise injection.' },
    { label: 'AWS Nitro Cloud Provision', prompt: 'Deploy zero-trust ECS Fargate container with AWS Nitro Enclaves attestation.' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
              LAYER 2: Infrastructure & Routing
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              FRAMER MOTION ANIMATED
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Cyber-Node Canvas & Cognitive Intent Engine
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Multi-hop packet dispatch animation, real-time Gemini AI intent parsing, and zero-trust domain boundaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-cyan-300 bg-slate-800 px-3 py-1.5 rounded border border-slate-700 font-mono">
            {routes.length} Verified Routes Active
          </span>
        </div>
      </div>

      {/* Neural Intent Prompt Input Pane */}
      <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Cognitive Neural Intent Dispatcher</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Gemini AI Verified</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
            placeholder="Type neural directive (e.g. 'Rotate 512-bit post-quantum key in hardware enclave...')"
            className="flex-1 px-4 py-2 rounded bg-slate-900/80 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
          />
          <button
            onClick={handleSendPrompt}
            disabled={isAnalyzing || !promptInput.trim()}
            className="px-4 py-2 rounded text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{isAnalyzing ? 'Parsing...' : 'Dispatch Intent'}</span>
          </button>
        </div>

        {/* Preset Quick Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400 mr-1">Quick Directives:</span>
          {presetIntents.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPromptInput(item.prompt);
              }}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Live Analysis Feedback Box */}
        {activeAnalysis && (
          <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-700 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 font-mono">
                  {activeAnalysis.intentType}
                </span>
                <span className="text-slate-300 font-medium">{activeAnalysis.classification}</span>
              </div>
              <span className={`px-2 py-0.5 rounded font-bold font-mono ${
                activeAnalysis.riskLevel === 'SAFE' ? 'bg-emerald-500/20 text-emerald-300' :
                activeAnalysis.riskLevel === 'ELEVATED' ? 'bg-amber-500/20 text-amber-300' :
                'bg-rose-500/20 text-rose-300'
              }`}>
                RISK: {activeAnalysis.riskLevel} (Confidence {(activeAnalysis.confidenceScore * 100).toFixed(1)}%)
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">{activeAnalysis.summary}</p>
            <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
              <span>Recommended Packet Hop Path:</span>
              <div className="flex items-center gap-1">
                {activeAnalysis.recommendedHops.map((hop, i) => (
                  <React.Fragment key={i}>
                    <span className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                      arrivedNodeIds.has(hop) 
                        ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {hop.replace('NODE_', '')}
                    </span>
                    {i < activeAnalysis.recommendedHops.length - 1 && <ArrowRight className="w-3 h-3 text-slate-600" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cyber-Node Interactive Visual Canvas with Framer Motion Packets */}
      <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Interactive Infrastructure Mesh Canvas</h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Manual Packet Trigger Button */}
            <button
              onClick={() => triggerPacketFlowAnimation()}
              disabled={isDispatching}
              className="px-3 py-1.5 rounded text-xs font-mono font-semibold bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Simulate Packet Surge</span>
            </button>

            {/* Continuous Flow Toggle */}
            <button
              onClick={() => setContinuousFlow(!continuousFlow)}
              className={`px-2.5 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 border transition cursor-pointer ${
                continuousFlow
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
              title="Toggle ambient background mesh pulse"
            >
              <Radio className={`w-3.5 h-3.5 ${continuousFlow ? 'animate-pulse text-emerald-400' : ''}`} />
              <span>{continuousFlow ? 'Ambient Stream ON' : 'Ambient Stream OFF'}</span>
            </button>
          </div>
        </div>

        {/* Graphical Mesh Canvas */}
        <div className="relative w-full h-88 sm:h-[420px] rounded-lg bg-black/50 border border-slate-800 overflow-hidden p-4 select-none">
          {/* Subtle Radar Background & Grid Lines */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-72 h-72 rounded-full border border-slate-600"></div>
            <div className="absolute w-[440px] h-[440px] rounded-full border border-slate-700"></div>
            <div className="absolute w-[600px] h-[600px] rounded-full border border-slate-800"></div>
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
          </div>

          {/* SVG Overlay for Connections & Traveling Framer Motion Packets */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {/* Draw Static Mesh Topology Lines */}
            {routes.map((route) => {
              const srcNode = nodes.find(n => n.id === route.sourceNodeId);
              const tgtNode = nodes.find(n => n.id === route.targetNodeId);
              if (!srcNode || !tgtNode) return null;

              const x1 = `${srcNode.normalizedX * 85 + 5}%`;
              const y1 = `${srcNode.normalizedY * 80 + 5}%`;
              const x2 = `${tgtNode.normalizedX * 85 + 5}%`;
              const y2 = `${tgtNode.normalizedY * 80 + 5}%`;

              return (
                <line
                  key={route.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />
              );
            })}

            {/* Continuous Ambient Flow Particles */}
            {continuousFlow && nodes.map((srcNode, idx) => {
              const nextNode = nodes[(idx + 1) % nodes.length];
              const x1 = srcNode.normalizedX * 85 + 5;
              const y1 = srcNode.normalizedY * 80 + 5;
              const x2 = nextNode.normalizedX * 85 + 5;
              const y2 = nextNode.normalizedY * 80 + 5;

              return (
                <motion.circle
                  key={`ambient-${idx}`}
                  r="2.5"
                  fill="#38BDF8"
                  initial={{ cx: `${x1}%`, cy: `${y1}%`, opacity: 0.2 }}
                  animate={{
                    cx: [`${x1}%`, `${x2}%`],
                    cy: [`${y1}%`, `${y2}%`],
                    opacity: [0.1, 0.7, 0.1]
                  }}
                  transition={{
                    duration: 3.5 + (idx % 3),
                    repeat: Infinity,
                    ease: 'linear',
                    delay: idx * 0.6
                  }}
                />
              );
            })}
          </svg>

          {/* Active Framer Motion Packet Layer (Triggered on Dispatch Intent) */}
          <AnimatePresence>
            {activePackets.map((pkt) => (
              <motion.div
                key={`${pkt.id}-${dispatchBurstId}`}
                initial={{
                  left: `${pkt.startX}%`,
                  top: `${pkt.startY}%`,
                  opacity: 0,
                  scale: 0.5
                }}
                animate={{
                  left: [`${pkt.startX}%`, `${pkt.endX}%`],
                  top: [`${pkt.startY}%`, `${pkt.endY}%`],
                  opacity: [0, 1, 1, 0.8],
                  scale: [0.8, 1.2, 1]
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  duration: pkt.duration,
                  delay: pkt.delay,
                  ease: 'easeInOut'
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex flex-col items-center"
              >
                {/* Glowing Packet Core with Pulse Aura */}
                <div className="relative">
                  <div
                    style={{ backgroundColor: pkt.color, boxShadow: `0 0 16px ${pkt.color}` }}
                    className="w-4 h-4 rounded-full border-2 border-white animate-pulse flex items-center justify-center"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                  {/* Expanding Ring Ripple */}
                  <motion.div
                    animate={{ scale: [1, 2.8], opacity: [0.8, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    style={{ borderColor: pkt.color }}
                    className="absolute inset-0 rounded-full border"
                  />
                </div>

                {/* Packet Payload Hash Label Badge */}
                <div className="mt-1 px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-700 text-[9px] font-mono text-cyan-300 font-bold whitespace-nowrap shadow-lg">
                  {pkt.label}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Node Cards Positioned on the Canvas */}
          <div className="relative w-full h-full">
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isEnclave = node.isHardwareEnclave;
              const isArrived = arrivedNodeIds.has(node.id);

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  style={{
                    left: `${node.normalizedX * 85 + 5}%`,
                    top: `${node.normalizedY * 80 + 5}%`
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                    isSelected ? 'scale-110 z-20' : 'hover:scale-105 z-10'
                  }`}
                >
                  {/* Node Ripple Effect on Packet Arrival */}
                  {isArrived && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0.9 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className={`absolute -inset-2 rounded-xl border-2 pointer-events-none ${
                        isEnclave ? 'border-rose-400' : 'border-cyan-400'
                      }`}
                    />
                  )}

                  <div className={`p-3 rounded-lg border font-mono transition-all ${
                    isEnclave 
                      ? 'bg-rose-950/85 border-rose-500 text-rose-200 shadow-lg'
                      : isSelected
                      ? 'bg-slate-800 border-cyan-400 text-cyan-200 shadow-lg'
                      : isArrived
                      ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-md ring-2 ring-cyan-500/30'
                      : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}>
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      {isEnclave ? <Lock className="w-3.5 h-3.5 text-rose-400" /> : <Cpu className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>{node.shortLabel}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between gap-2">
                      <span>{node.latencyNs}ns</span>
                      <span className={isEnclave ? 'text-rose-300' : 'text-cyan-300'}>
                        {(node.activeLoad * 100).toFixed(0)}% load
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Dispatch HUD Overlay */}
          {isDispatching && (
            <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-slate-950/90 border border-cyan-500/50 flex items-center gap-2 text-xs font-mono text-cyan-300 z-20 shadow-xl animate-fadeIn">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span className="font-bold">TRANSMITTING PACKET INTENT BURST</span>
              <span className="text-slate-400 text-[10px]">
                ({arrivedNodeIds.size} / {nodes.length} Nodes Attested)
              </span>
            </div>
          )}
        </div>

        {/* Selected Node Details Pane */}
        {selectedNode && (
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block">Active Node</span>
              <span className="text-white font-bold text-sm">{selectedNode.name}</span>
              <span className="text-cyan-400 block text-[11px] font-mono">{selectedNode.tierLabel}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Security Protocol</span>
              <span className="text-slate-200 font-medium">{selectedNode.securityProtocol}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Telemetry Load</span>
              <span className="text-emerald-400 font-bold font-mono">{selectedNode.activePackets} packets/sec</span>
              <p className="text-[10px] text-slate-400 mt-0.5">{selectedNode.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Verified Routes Table */}
      <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Verified Route Topologies</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Attested Paths</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {routes.map((route) => (
            <div
              key={route.id}
              onClick={() => {
                setSelectedRoute(route);
                triggerPacketFlowAnimation([route.sourceNodeId, route.targetNodeId]);
              }}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedRoute.id === route.id
                  ? 'bg-slate-800/80 border-cyan-400 text-white shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold">{route.name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  route.riskLevel === 'SAFE' ? 'bg-emerald-500/20 text-emerald-300' :
                  route.riskLevel === 'ELEVATED' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-rose-500/20 text-rose-300'
                }`}>
                  {route.riskLevel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">{route.description}</p>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                <span>Latency: {route.latencyMs}ms</span>
                <span className="text-cyan-400 font-semibold">{route.cryptographicDigest}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

