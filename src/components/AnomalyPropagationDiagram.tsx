import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Zap, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Sliders,
  Filter,
  Play,
  Pause,
  ArrowRight,
  Cpu,
  Lock,
  Flame,
  CheckSquare
} from 'lucide-react';
import { TelemetryAnomalyAlert, TelemetryAnomalyType } from '../types';

export interface AnomalyPropagationDiagramProps {
  alerts: TelemetryAnomalyAlert[];
  onSelectAlert?: (alert: TelemetryAnomalyAlert) => void;
  onMitigateAlert: (alertId: string, action: string) => void;
  onSimulateAnomaly?: (type: TelemetryAnomalyType) => void;
  onPushToTasks?: (alert: TelemetryAnomalyAlert) => void;
  className?: string;
}

interface CyberNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  sublabel: string;
  layer: number;
  layerName: string;
  type: 'core' | 'enclave' | 'security' | 'gateway' | 'agent' | 'threat';
  status: 'OPERATIONAL' | 'WARNING' | 'COMPROMISED' | 'QUARANTINED' | 'SEALED';
  hardwareAddress: string;
  threatCount: number;
  criticalCount: number;
  iconType: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface CyberLink extends d3.SimulationLinkDatum<CyberNode> {
  id: string;
  source: string | CyberNode;
  target: string | CyberNode;
  protocol: string;
  bandwidth: string;
  isThreatPath: boolean;
  threatType?: string;
  threatSeverity?: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

const INITIAL_NODES: CyberNode[] = [
  {
    id: 'NODE_01_COMPOSERY',
    label: 'UI Vector Composery',
    sublabel: 'Layer 1 Optical Canvas',
    layer: 1,
    layerName: 'Quantum Glass UI',
    type: 'core',
    status: 'OPERATIONAL',
    hardwareAddress: '0x0010_DISP_VEC',
    threatCount: 0,
    criticalCount: 0,
    iconType: 'display'
  },
  {
    id: 'NODE_02_VIEWMODEL',
    label: 'Neural ViewModel',
    sublabel: 'Layer 2 Intent Dispatcher',
    layer: 2,
    layerName: 'Neural Intent Routing',
    type: 'core',
    status: 'OPERATIONAL',
    hardwareAddress: '0x0020_NEUR_DISP',
    threatCount: 0,
    criticalCount: 0,
    iconType: 'brain'
  },
  {
    id: 'NODE_03_POLICY_GATE',
    label: 'Zero-Trust Invariant Gate',
    sublabel: 'Layer 3 Hardware Filter',
    layer: 3,
    layerName: 'Hardened Architecture',
    type: 'security',
    status: 'OPERATIONAL',
    hardwareAddress: '0x0030_ZT_GATE',
    threatCount: 0,
    criticalCount: 0,
    iconType: 'shield'
  },
  {
    id: 'NODE_04_ENCLAVE',
    label: '512-bit Kyber Enclave',
    sublabel: 'Layer 5 Dual Memory Vault',
    layer: 5,
    layerName: 'Post-Quantum Enclave',
    type: 'enclave',
    status: 'SEALED',
    hardwareAddress: '0x7FFF_8000_PQE',
    threatCount: 0,
    criticalCount: 0,
    iconType: 'key'
  },
  {
    id: 'NODE_05_DP_SANITIZER',
    label: 'Threat Shield & DP Sanitizer',
    sublabel: 'Layer 4 Laplace ε=0.5 Filter',
    layer: 4,
    layerName: 'Shield Defense Path',
    type: 'security',
    status: 'OPERATIONAL',
    hardwareAddress: '0x0050_DP_LAPLACE',
    threatCount: 0,
    criticalCount: 0,
    iconType: 'filter'
  },
  {
    id: 'NODE_06_EGRESS',
    label: 'Perimeter Egress Gateway',
    sublabel: 'TLS 1.3 / AWS Nitro Egress',
    layer: 4,
    layerName: 'Perimeter Security',
    type: 'gateway',
    status: 'OPERATIONAL',
    hardwareAddress: '0x0060_EGR_PROXY',
    threatCount: 0,
    criticalCount: 0,
    iconType: 'cloud'
  },
  {
    id: 'NODE_07_AGENTS',
    label: 'Autonomous Agent Swarm',
    sublabel: 'Layer 6 Sub-Agent Mesh',
    layer: 6,
    layerName: 'Autonomous Validation',
    type: 'agent',
    status: 'OPERATIONAL',
    hardwareAddress: '0x0070_AGENT_SWARM',
    threatCount: 0,
    criticalCount: 0,
    iconType: 'cpu'
  }
];

const INITIAL_LINKS: { source: string; target: string; protocol: string; bandwidth: string; isThreatPath: boolean }[] = [
  { source: 'NODE_01_COMPOSERY', target: 'NODE_02_VIEWMODEL', protocol: 'IPC Photonic Event Loop', bandwidth: '4.8 GB/s', isThreatPath: false },
  { source: 'NODE_02_VIEWMODEL', target: 'NODE_03_POLICY_GATE', protocol: 'Unidirectional State Stream', bandwidth: '1.2 GB/s', isThreatPath: false },
  { source: 'NODE_03_POLICY_GATE', target: 'NODE_04_ENCLAVE', protocol: 'Kyber-1024 Lattice Bus', bandwidth: '850 MB/s', isThreatPath: false },
  { source: 'NODE_03_POLICY_GATE', target: 'NODE_05_DP_SANITIZER', protocol: 'Differential Privacy Pipeline', bandwidth: '620 MB/s', isThreatPath: false },
  { source: 'NODE_05_DP_SANITIZER', target: 'NODE_06_EGRESS', protocol: 'Sanitized Zero-Leak Buffer', bandwidth: '240 MB/s', isThreatPath: false },
  { source: 'NODE_04_ENCLAVE', target: 'NODE_02_VIEWMODEL', protocol: 'Attested State Confirmation', bandwidth: '300 MB/s', isThreatPath: false },
  { source: 'NODE_07_AGENTS', target: 'NODE_02_VIEWMODEL', protocol: 'Cognitive Task Dispatch', bandwidth: '180 MB/s', isThreatPath: false },
  { source: 'NODE_07_AGENTS', target: 'NODE_04_ENCLAVE', protocol: 'Hardware Proof Verification', bandwidth: '95 MB/s', isThreatPath: false }
];

export const AnomalyPropagationDiagram: React.FC<AnomalyPropagationDiagramProps> = ({
  alerts,
  onSelectAlert,
  onMitigateAlert,
  onSimulateAnomaly,
  onPushToTasks,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [selectedNode, setSelectedNode] = useState<CyberNode | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<TelemetryAnomalyAlert | null>(null);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'UNRESOLVED' | 'CRITICAL' | 'HIGH' | 'MITIGATED'>('ALL');
  const [layoutMode, setLayoutMode] = useState<'FORCE' | 'HIERARCHICAL'>('FORCE');
  const [isPaused, setIsPaused] = useState(false);
  const [particleSpeed, setParticleSpeed] = useState<number>(1);
  const [hoveredNode, setHoveredNode] = useState<CyberNode | null>(null);

  // Derive dynamic cyber-nodes and active anomaly links
  const { nodes, links, activeAlerts } = useMemo(() => {
    const unmitigated = alerts.filter(a => !a.isMitigated);
    
    // Deep clone nodes
    const nodeMap = new Map<string, CyberNode>();
    INITIAL_NODES.forEach(n => {
      nodeMap.set(n.id, {
        ...n,
        threatCount: 0,
        criticalCount: 0,
        status: 'OPERATIONAL'
      });
    });

    // Update node threat counts from unmitigated alerts
    unmitigated.forEach(alert => {
      const targetNode = nodeMap.get(alert.affectedDomainOrNode);
      if (targetNode) {
        targetNode.threatCount += 1;
        if (alert.severity === 'CRITICAL') {
          targetNode.criticalCount += 1;
          targetNode.status = 'COMPROMISED';
        } else if (targetNode.status !== 'COMPROMISED') {
          targetNode.status = 'WARNING';
        }
      }
    });

    // Compute active propagation links
    const linkList: CyberLink[] = INITIAL_LINKS.map(l => {
      // Check if this link involves a compromised or warning node
      const sourceAlerts = unmitigated.filter(a => a.affectedDomainOrNode === l.source);
      const targetAlerts = unmitigated.filter(a => a.affectedDomainOrNode === l.target);
      const hasThreat = sourceAlerts.length > 0 || targetAlerts.length > 0;
      const criticalAlert = [...sourceAlerts, ...targetAlerts].find(a => a.severity === 'CRITICAL');
      const highAlert = [...sourceAlerts, ...targetAlerts].find(a => a.severity === 'HIGH');

      return {
        id: `${l.source}->${l.target}`,
        source: l.source,
        target: l.target,
        protocol: l.protocol,
        bandwidth: l.bandwidth,
        isThreatPath: hasThreat,
        threatSeverity: criticalAlert ? 'CRITICAL' : highAlert ? 'HIGH' : hasThreat ? 'MEDIUM' : undefined,
        threatType: (criticalAlert || highAlert || sourceAlerts[0] || targetAlerts[0])?.anomalyType
      };
    });

    return {
      nodes: Array.from(nodeMap.values()),
      links: linkList,
      activeAlerts: unmitigated
    };
  }, [alerts]);

  // Main D3 force simulation and SVG rendering
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    svg.selectAll('*').remove();

    // Definitions (Gradients, Arrowheads, Glow Filters)
    const defs = svg.append('defs');

    // Arrow marker normal
    defs.append('marker')
      .attr('id', 'arrow-normal')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#38BDF8');

    // Arrow marker threat critical
    defs.append('marker')
      .attr('id', 'arrow-threat-critical')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#F43F5E');

    // Arrow marker threat high
    defs.append('marker')
      .attr('id', 'arrow-threat-high')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#F59E0B');

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Root Group with Zoom Support
    const g = svg.append('g').attr('class', 'main-canvas');

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);

    // Initial position presets based on layout mode
    const simNodes = nodes.map(d => ({ ...d }));
    const simLinks = links.map(d => ({ ...d }));

    if (layoutMode === 'HIERARCHICAL') {
      const layerX: Record<number, number> = {
        1: width * 0.15,
        2: width * 0.35,
        3: width * 0.55,
        4: width * 0.75,
        5: width * 0.55,
        6: width * 0.35
      };
      simNodes.forEach((node, i) => {
        if (node.id === 'NODE_04_ENCLAVE') {
          node.fx = width * 0.55;
          node.fy = height * 0.75;
        } else if (node.id === 'NODE_07_AGENTS') {
          node.fx = width * 0.35;
          node.fy = height * 0.75;
        } else if (node.id === 'NODE_06_EGRESS') {
          node.fx = width * 0.85;
          node.fy = height * 0.5;
        } else {
          node.fx = layerX[node.layer] || width * 0.5;
          node.fy = height * 0.35;
        }
      });
    }

    // Force simulation
    const simulation = d3.forceSimulation<CyberNode>(simNodes)
      .force('link', d3.forceLink<CyberNode, CyberLink>(simLinks)
        .id(d => d.id)
        .distance(layoutMode === 'FORCE' ? 140 : 180)
        .strength(0.6)
      )
      .force('charge', d3.forceManyBody().strength(layoutMode === 'FORCE' ? -450 : -200))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.1))
      .force('collide', d3.forceCollide().radius(50).iterations(2));

    // Render Links Group
    const linkGroup = g.append('g').attr('class', 'links');

    const link = linkGroup.selectAll<SVGLineElement, CyberLink>('.link-line')
      .data(simLinks)
      .enter()
      .append('line')
      .attr('class', 'link-line')
      .attr('stroke', (d: CyberLink) => {
        if (d.threatSeverity === 'CRITICAL') return '#F43F5E';
        if (d.threatSeverity === 'HIGH') return '#F59E0B';
        return '#334155';
      })
      .attr('stroke-width', (d: CyberLink) => (d.isThreatPath ? 3 : 1.5))
      .attr('stroke-dasharray', (d: CyberLink) => (d.isThreatPath ? '6 3' : 'none'))
      .attr('marker-end', (d: CyberLink) => {
        if (d.threatSeverity === 'CRITICAL') return 'url(#arrow-threat-critical)';
        if (d.threatSeverity === 'HIGH') return 'url(#arrow-threat-high)';
        return 'url(#arrow-normal)';
      })
      .attr('opacity', 0.8);

    // Render Link Labels (Protocol & Bandwidth)
    const linkLabel = linkGroup.selectAll<SVGTextElement, CyberLink>('.link-label')
      .data(simLinks)
      .enter()
      .append('text')
      .attr('class', 'link-label')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('fill', (d: CyberLink) => (d.isThreatPath ? (d.threatSeverity === 'CRITICAL' ? '#FDA4AF' : '#FDE68A') : '#64748B'))
      .attr('text-anchor', 'middle')
      .text((d: CyberLink) => (d.isThreatPath ? `⚠️ ${d.threatType || 'ANOMALY'} (${d.bandwidth})` : d.bandwidth));

    // Animated Telemetry / Anomaly Particles along links
    const particleGroup = g.append('g').attr('class', 'particles');
    const particles = particleGroup.selectAll<SVGCircleElement, CyberLink>('.packet-particle')
      .data(simLinks)
      .enter()
      .append('circle')
      .attr('class', 'packet-particle')
      .attr('r', (d: CyberLink) => (d.isThreatPath ? 4.5 : 3))
      .attr('fill', (d: CyberLink) => {
        if (d.threatSeverity === 'CRITICAL') return '#FF2255';
        if (d.threatSeverity === 'HIGH') return '#FBBF24';
        return '#38BDF8';
      })
      .attr('filter', 'url(#glow)');

    // Render Nodes Group
    const nodeGroup = g.append('g').attr('class', 'nodes');

    const node = nodeGroup.selectAll<SVGGElement, CyberNode>('.node-item')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('class', 'node-item')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, CyberNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            if (layoutMode === 'FORCE') {
              d.fx = null;
              d.fy = null;
            }
          })
      );

    // Threat Pulse Ring around compromised nodes
    node.filter((d: CyberNode) => d.threatCount > 0)
      .append('circle')
      .attr('r', 38)
      .attr('fill', 'none')
      .attr('stroke', (d: CyberNode) => (d.criticalCount > 0 ? '#F43F5E' : '#F59E0B'))
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4 2')
      .attr('class', 'animate-spin')
      .attr('opacity', 0.8);

    // Outer Aura Ring
    node.append('circle')
      .attr('r', 30)
      .attr('fill', (d: CyberNode) => {
        if (d.status === 'COMPROMISED') return 'rgba(244, 63, 94, 0.15)';
        if (d.status === 'WARNING') return 'rgba(245, 158, 11, 0.15)';
        if (d.status === 'SEALED') return 'rgba(16, 185, 129, 0.15)';
        return 'rgba(6, 182, 212, 0.12)';
      })
      .attr('stroke', (d: CyberNode) => {
        if (d.status === 'COMPROMISED') return '#F43F5E';
        if (d.status === 'WARNING') return '#F59E0B';
        if (d.status === 'SEALED') return '#10B981';
        return '#06B6D4';
      })
      .attr('stroke-width', 2)
      .attr('filter', (d: CyberNode) => (d.threatCount > 0 ? 'url(#glow)' : 'none'));

    // Node Core Base Box/Circle
    node.append('circle')
      .attr('r', 22)
      .attr('fill', '#1E293B')
      .attr('stroke', '#334155')
      .attr('stroke-width', 1.5);

    // Inner Hardware / Role Icon Representation
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '12px')
      .attr('fill', (d: CyberNode) => {
        if (d.status === 'COMPROMISED') return '#FDA4AF';
        if (d.status === 'WARNING') return '#FDE68A';
        if (d.status === 'SEALED') return '#6EE7B7';
        return '#38BDF8';
      })
      .text((d: CyberNode) => {
        if (d.id === 'NODE_04_ENCLAVE') return '🔒';
        if (d.id === 'NODE_05_DP_SANITIZER') return '🛡️';
        if (d.id === 'NODE_07_AGENTS') return '🤖';
        if (d.id === 'NODE_06_EGRESS') return '☁️';
        if (d.id === 'NODE_03_POLICY_GATE') return '⚡';
        return '💠';
      });

    // Threat Count Badge on top right of node
    const badgeGroup = node.filter((d: CyberNode) => d.threatCount > 0).append('g')
      .attr('transform', 'translate(18, -18)');
    
    badgeGroup.append('circle')
      .attr('r', 9)
      .attr('fill', (d: CyberNode) => (d.criticalCount > 0 ? '#E11D48' : '#D97706'))
      .attr('stroke', '#0F172A')
      .attr('stroke-width', 1.5);

    badgeGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('fill', '#FFFFFF')
      .text((d: CyberNode) => d.threatCount);

    // Node Label
    node.append('text')
      .attr('y', 42)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#F8FAFC')
      .attr('font-family', 'sans-serif')
      .text((d: CyberNode) => d.label);

    // Node Sublabel / Layer
    node.append('text')
      .attr('y', 55)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', '#94A3B8')
      .attr('font-family', 'monospace')
      .text((d: CyberNode) => d.hardwareAddress);

    // Node Click & Hover handlers
    node.on('click', (event, d: CyberNode) => {
      event.stopPropagation();
      setSelectedNode(d);
      const relevantAlert = alerts.find(a => a.affectedDomainOrNode === d.id && !a.isMitigated) || null;
      setSelectedAlert(relevantAlert);
    });

    node.on('mouseenter', (event, d: CyberNode) => {
      setHoveredNode(d);
    });

    node.on('mouseleave', () => {
      setHoveredNode(null);
    });

    // Background click resets selection
    svg.on('click', () => {
      setSelectedNode(null);
      setSelectedAlert(null);
    });

    // Particle Animation Loop
    let animationFrameId: number;
    let progress = 0;

    const animateParticles = () => {
      if (!isPaused) {
        progress = (progress + 0.006 * particleSpeed) % 1;
        particles.each(function(d: any) {
          if (d.source && d.target && typeof d.source.x === 'number' && typeof d.target.x === 'number') {
            const sx = d.source.x;
            const sy = d.source.y;
            const tx = d.target.x;
            const ty = d.target.y;

            // Interpolate position along link
            const curX = sx + (tx - sx) * progress;
            const curY = sy + (ty - sy) * progress;

            d3.select(this)
              .attr('cx', curX)
              .attr('cy', curY);
          }
        });
      }
      animationFrameId = requestAnimationFrame(animateParticles);
    };

    animationFrameId = requestAnimationFrame(animateParticles);

    // Tick update
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkLabel
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 6);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Cleanup on unmount or re-render
    return () => {
      simulation.stop();
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes, links, layoutMode, isPaused, particleSpeed]);

  // Zoom control helpers
  const handleZoom = (factor: number) => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
      factor
    );
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !containerRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(400).call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomIdentity
    );
  };

  return (
    <div className={`rounded-xl border border-slate-800 bg-[#1E293B] flex flex-col overflow-hidden shadow-sm ${className}`}>
      {/* Top Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-[#1E293B]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-200 text-sm">
                Interactive Telemetry Anomaly & Propagation Matrix
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                D3.js Force Simulation
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live directional vector propagation across 7 cyber-node hardware domains
            </p>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Layout Mode Toggle */}
          <div className="flex rounded bg-slate-800 p-0.5 border border-slate-700">
            <button
              onClick={() => setLayoutMode('FORCE')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${layoutMode === 'FORCE' ? 'bg-cyan-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              title="Force-directed dynamic physics layout"
            >
              Force Mesh
            </button>
            <button
              onClick={() => setLayoutMode('HIERARCHICAL')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${layoutMode === 'HIERARCHICAL' ? 'bg-cyan-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              title="Sequential layered security architecture flow"
            >
              Layered Flow
            </button>
          </div>

          {/* Pause / Play Simulation */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-1.5 rounded border transition cursor-pointer ${isPaused ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'}`}
            title={isPaused ? 'Resume Propagation Animation' : 'Pause Propagation Animation'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1 bg-slate-800 rounded border border-slate-700 p-0.5">
            <button
              onClick={() => handleZoom(1.25)}
              className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(0.8)}
              className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Threat Simulation Trigger */}
          {onSimulateAnomaly && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onSimulateAnomaly('PROMPT_INJECTION_PAYLOAD')}
                className="px-2 py-1 rounded bg-rose-950/80 border border-rose-500/50 text-rose-300 hover:bg-rose-900 transition flex items-center gap-1 cursor-pointer"
                title="Simulate Prompt Injection Attack"
              >
                <Flame className="w-3 h-3 text-rose-400" />
                <span>+ Probe</span>
              </button>
              <button
                onClick={() => onSimulateAnomaly('UNMASKED_PII_LEAK')}
                className="px-2 py-1 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 hover:bg-amber-900 transition flex items-center gap-1 cursor-pointer"
                title="Simulate Telemetry PII Leak"
              >
                <span>+ PII Leak</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Diagram Area with Side Detail Inspector */}
      <div className="relative flex-1 flex flex-col lg:flex-row min-h-[460px] bg-[#0F172A]">
        {/* D3 SVG Container */}
        <div ref={containerRef} className="flex-1 h-[460px] relative overflow-hidden">
          <svg
            ref={svgRef}
            className="w-full h-full cursor-grab active:cursor-grabbing select-none"
          />

          {/* Floating Diagram Legend */}
          <div className="absolute bottom-3 left-3 p-2.5 rounded bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1.5 pointer-events-none backdrop-blur-sm shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span>Sanitized Telemetry Vector</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span>Critical Anomaly Ingress (Quarantined)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>High Alert Warning Path</span>
            </div>
          </div>
        </div>

        {/* Node & Anomaly Detail Inspector Drawer */}
        {selectedNode ? (
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-800 bg-[#1E293B] p-4 flex flex-col justify-between space-y-4 overflow-y-auto shrink-0 shadow-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  NODE TELEMETRY INSPECTOR
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  selectedNode.status === 'COMPROMISED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                  selectedNode.status === 'WARNING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {selectedNode.status}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white font-mono">{selectedNode.label}</h3>
                <p className="text-xs text-slate-400">{selectedNode.sublabel}</p>
                <div className="mt-2 p-2 bg-slate-900/80 rounded border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hardware ID:</span>
                    <span className="text-cyan-300">{selectedNode.hardwareAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Layer Tier:</span>
                    <span>Layer {selectedNode.layer} ({selectedNode.layerName})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Active Threats:</span>
                    <span className={selectedNode.threatCount > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {selectedNode.threatCount} Detected
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Threats Affecting This Node */}
              {selectedAlert ? (
                <div className="p-3 rounded bg-rose-950/40 border border-rose-500/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-rose-300 font-mono font-bold">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Active Telemetry Breach Alert</span>
                  </div>
                  <p className="text-xs text-slate-200 font-medium">{selectedAlert.title}</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{selectedAlert.description}</p>
                  <pre className="p-2 bg-black/50 rounded text-[10px] font-mono text-rose-300 overflow-x-auto whitespace-pre-wrap">
                    {selectedAlert.detectedPayloadSnippet}
                  </pre>
                  
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => onMitigateAlert(selectedAlert.id, 'ZERO_TRUST_ISOLATION')}
                      className="flex-1 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono transition shadow-sm cursor-pointer"
                    >
                      Quarantine Vector
                    </button>
                    {onPushToTasks && (
                      <button
                        onClick={() => onPushToTasks(selectedAlert)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition cursor-pointer"
                        title="Push to Google Tasks"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No unmitigated anomaly propagation vectors on this domain.</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedNode(null)}
                className="w-full py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/60 rounded border border-slate-700 hover:bg-slate-700 transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex w-72 border-l border-slate-800 bg-[#111827] p-4 flex-col justify-between text-xs text-slate-400">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Node Vector Propagation</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Click any node in the interactive D3.js matrix to inspect its real-time telemetry stream, hardware address, cryptographic integrity state, and quarantined attack paths.
              </p>

              <div className="p-3 bg-slate-800/40 rounded border border-slate-700/50 space-y-2 font-mono text-[11px]">
                <div className="text-slate-300 font-medium">Topology Invariants:</div>
                <div className="text-slate-400">✓ Unidirectional State Loop</div>
                <div className="text-slate-400">✓ Laplace Differential Noise</div>
                <div className="text-slate-400">✓ Kyber-1024 Memory Shield</div>
                <div className="text-slate-400">✓ Zero-Egress PII Redaction</div>
              </div>
            </div>

            <div className="p-3 bg-slate-800/30 rounded border border-slate-700/40 text-[11px] font-mono">
              <span className="text-cyan-400">Drag:</span> Position nodes<br/>
              <span className="text-cyan-400">Scroll:</span> Zoom in / out<br/>
              <span className="text-cyan-400">Click:</span> Inspect & mitigate
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
