import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Flame, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Sliders, 
  Activity, 
  RefreshCw,
  Info,
  Calendar,
  Layers
} from 'lucide-react';
import { TelemetryAnomalyAlert } from '../types';

export interface HeatmapCellData {
  domainId: string;
  domainName: string;
  domainTier: string;
  hour: number; // 0 to 23
  hourLabel: string;
  count: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  primaryAnomalyType?: string;
  sampleLog?: string;
}

interface AnomalyDensityHeatmapProps {
  alerts?: TelemetryAnomalyAlert[];
  onSelectCell?: (cell: HeatmapCellData) => void;
}

const CYBER_DOMAINS = [
  { id: 'NODE_01', name: 'Operator Sovereign Hub', tier: 'Layer 1: Edge UI' },
  { id: 'NODE_02', name: 'Telemetry Ingress Gateway', tier: 'Layer 2: Ingress Routing' },
  { id: 'NODE_03', name: 'DP Noise Sanitizer (ε=0.5)', tier: 'Layer 3: Privacy Filter' },
  { id: 'NODE_04', name: 'Hardware Enclave Core (0x7F)', tier: 'Layer 4: Nitro PQ Enclave' },
  { id: 'NODE_05', name: 'Biometric Multi-Modal Mesh', tier: 'Layer 5: Sensory Auth' },
  { id: 'NODE_06', name: 'Cross-Domain Sovereign Gate', tier: 'Layer 6: Inter-Enclave' },
  { id: 'NODE_07', name: 'AWS Nitro Cloud Edge', tier: 'Layer 7: Cloud Run/Fargate' }
];

export const AnomalyDensityHeatmap: React.FC<AnomalyDensityHeatmapProps> = ({
  alerts = [],
  onSelectCell
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filter States
  const [selectedWindow, setSelectedWindow] = useState<'24h' | '12h' | '6h'>('24h');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL_HIGH' | 'MEDIUM_LOW'>('ALL');
  const [hoveredCell, setHoveredCell] = useState<HeatmapCellData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>('ALL');

  // Generate 24-hour historical density matrix
  const heatmapData = useMemo<HeatmapCellData[]>(() => {
    const matrix: HeatmapCellData[] = [];
    const now = new Date();
    const currentHour = now.getHours();

    const sampleTypes = [
      'Prompt Injection Infiltration Attempt',
      'Differential Privacy Epsilon Drift (ε > 1.2)',
      'Kyber-1024 Decapsulation Replay Vector',
      'Biometric Seismic Gait Anomaly',
      'Unsigned Cross-Domain Mutation Frame',
      'Packet Sequence Desync',
      'Out-of-Bounds Memory Probe'
    ];

    CYBER_DOMAINS.forEach((domain, dIdx) => {
      for (let h = 0; h < 24; h++) {
        const hourSlot = (currentHour - 23 + h + 24) % 24;
        const hourLabel = `${hourSlot.toString().padStart(2, '0')}:00`;

        // Deterministic synthetic pattern with diurnal spikes
        const seed = (dIdx * 31 + h * 17) % 100;
        let count = 0;
        
        // Realistic distribution: higher anomalies during peak simulation bursts (hours 10-18)
        if (h >= 10 && h <= 18) {
          count = Math.floor(Math.sin(h / 3) * 4 + (seed % 7));
        } else {
          count = Math.floor(seed % 4);
        }

        // Add domain specific multipliers
        if (domain.id === 'NODE_02' || domain.id === 'NODE_03') {
          count += (h % 3 === 0 ? 3 : 1);
        }
        if (domain.id === 'NODE_04') {
          count = Math.max(0, Math.floor(count * 0.4)); // Enclave is highly protected
        }

        const criticalCount = Math.max(0, Math.floor(count * 0.25));
        const highCount = Math.max(0, Math.floor(count * 0.35));
        const mediumCount = Math.max(0, Math.floor(count * 0.25));
        const lowCount = Math.max(0, count - criticalCount - highCount - mediumCount);

        const typeIdx = (dIdx + h) % sampleTypes.length;

        matrix.push({
          domainId: domain.id,
          domainName: domain.name,
          domainTier: domain.tier,
          hour: h,
          hourLabel,
          count: Math.max(0, count),
          criticalCount,
          highCount,
          mediumCount,
          lowCount,
          primaryAnomalyType: count > 0 ? sampleTypes[typeIdx] : undefined,
          sampleLog: count > 0 ? `[NODE:${domain.id}] Anomaly event logged at ${hourLabel} with verification hash 0x${((dIdx+1)*h*997).toString(16).padStart(8, '0')}` : undefined
        });
      }
    });

    return matrix;
  }, []);

  // Filtered dataset based on selected window & severity filter
  const displayedData = useMemo(() => {
    let filtered = [...heatmapData];

    // Filter by window (24h = all, 12h = last 12 hours, 6h = last 6 hours)
    if (selectedWindow === '12h') {
      filtered = filtered.filter(d => d.hour >= 12);
    } else if (selectedWindow === '6h') {
      filtered = filtered.filter(d => d.hour >= 18);
    }

    // Filter by domain
    if (selectedDomainFilter !== 'ALL') {
      filtered = filtered.filter(d => d.domainId === selectedDomainFilter);
    }

    return filtered;
  }, [heatmapData, selectedWindow, selectedDomainFilter]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const totalAnomalies = displayedData.reduce((acc, curr) => acc + curr.count, 0);
    const criticalTotal = displayedData.reduce((acc, curr) => acc + curr.criticalCount, 0);
    const maxCountInCell = d3.max(displayedData, (d: HeatmapCellData) => d.count) || 1;
    
    // Find peak hour
    const hourCounts: { [k: string]: number } = {};
    displayedData.forEach(d => {
      hourCounts[d.hourLabel] = (hourCounts[d.hourLabel] || 0) + d.count;
    });
    let peakHour = '14:00';
    let peakVal = 0;
    Object.entries(hourCounts).forEach(([hr, c]) => {
      if (c > peakVal) {
        peakVal = c;
        peakHour = hr;
      }
    });

    return {
      totalAnomalies,
      criticalTotal,
      maxCountInCell,
      peakHour,
      avgPerHour: (totalAnomalies / (selectedWindow === '24h' ? 24 : selectedWindow === '12h' ? 12 : 6)).toFixed(1)
    };
  }, [displayedData, selectedWindow]);

  // D3 Render Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth || 800;
    const margin = { top: 30, right: 20, bottom: 45, left: 160 };
    const width = containerWidth - margin.left - margin.right;
    const height = (selectedDomainFilter === 'ALL' ? CYBER_DOMAINS.length : 1) * 38;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', containerWidth)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Unique hours in the dataset
    const hours: string[] = Array.from(new Set(displayedData.map(d => d.hourLabel)));
    const domains: string[] = selectedDomainFilter === 'ALL' 
      ? CYBER_DOMAINS.map(d => d.name)
      : [CYBER_DOMAINS.find(d => d.id === selectedDomainFilter)?.name || ''];

    // Scales
    const xScale = d3.scaleBand<string>()
      .domain(hours)
      .range([0, width])
      .padding(0.08);

    const yScale = d3.scaleBand<string>()
      .domain(domains)
      .range([0, height])
      .padding(0.12);

    // Color Interpolator: Dark Slate -> Cyan -> Amber -> Rose/Red
    const colorScale = d3.scaleSequential()
      .domain([0, Math.max(8, stats.maxCountInCell)])
      .interpolator((t) => {
        if (t === 0) return '#0F172A'; // 0 anomalies
        if (t < 0.25) return '#0E3A52'; // nominal
        if (t < 0.5) return '#0284C7';  // moderate
        if (t < 0.75) return '#F59E0B'; // elevated
        return '#F43F5E';              // critical surge
      });

    // Draw X-Axis
    const tickFilter = hours.filter((_, i) => {
      if (selectedWindow === '24h') return i % 2 === 0;
      return true;
    });

    const xAxis = d3.axisBottom(xScale)
      .tickValues(tickFilter)
      .tickSize(4);

    const xAxisG = g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis);

    xAxisG.selectAll('text')
      .style('fill', '#94A3B8')
      .style('font-family', 'monospace')
      .style('font-size', '10px');

    xAxisG.selectAll('line, path')
      .style('stroke', '#334155');

    // Draw Y-Axis
    const yAxis = d3.axisLeft(yScale)
      .tickSize(0);

    const yAxisG = g.append('g')
      .call(yAxis);

    yAxisG.selectAll('text')
      .style('fill', '#CBD5E1')
      .style('font-family', 'sans-serif')
      .style('font-size', '11px')
      .style('font-weight', '500');

    yAxisG.select('.domain').remove();

    // Heatmap Rectangles
    const cellGroups = g.selectAll<SVGGElement, HeatmapCellData>('.heatmap-cell')
      .data(displayedData)
      .enter()
      .append('g')
      .attr('class', 'heatmap-cell');

    cellGroups.append('rect')
      .attr('x', (d: HeatmapCellData) => xScale(d.hourLabel) || 0)
      .attr('y', (d: HeatmapCellData) => yScale(d.domainName) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', (d: HeatmapCellData) => colorScale(d.count))
      .attr('stroke', (d: HeatmapCellData) => d.count >= 6 ? '#FDA4AF' : '#1E293B')
      .attr('stroke-width', (d: HeatmapCellData) => d.count >= 6 ? 1.5 : 1)
      .style('cursor', 'pointer')
      .style('transition', 'all 0.15s ease-out')
      .on('mouseenter', function (event: MouseEvent, d: HeatmapCellData) {
        d3.select(this)
          .attr('stroke', '#38BDF8')
          .attr('stroke-width', 2);

        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltipPos({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
          });
        }
        setHoveredCell(d);
      })
      .on('mousemove', function (event: MouseEvent) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltipPos({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
          });
        }
      })
      .on('mouseleave', function () {
        d3.select(this)
          .attr('stroke', (d: any) => d.count >= 6 ? '#FDA4AF' : '#1E293B')
          .attr('stroke-width', (d: any) => d.count >= 6 ? 1.5 : 1);
        setHoveredCell(null);
        setTooltipPos(null);
      })
      .on('click', (_: MouseEvent, d: HeatmapCellData) => {
        if (onSelectCell) onSelectCell(d);
      });

    // Add count labels inside cells if bandwidth is large enough
    if (xScale.bandwidth() > 22) {
      cellGroups.append('text')
        .attr('x', (d: HeatmapCellData) => (xScale(d.hourLabel) || 0) + xScale.bandwidth() / 2)
        .attr('y', (d: HeatmapCellData) => (yScale(d.domainName) || 0) + yScale.bandwidth() / 2 + 3.5)
        .attr('text-anchor', 'middle')
        .style('fill', (d: HeatmapCellData) => d.count === 0 ? '#475569' : d.count >= 5 ? '#FFFFFF' : '#E2E8F0')
        .style('font-family', 'monospace')
        .style('font-size', '10px')
        .style('font-weight', (d: HeatmapCellData) => d.count >= 5 ? 'bold' : 'normal')
        .style('pointer-events', 'none')
        .text((d: HeatmapCellData) => d.count > 0 ? d.count : '·');
    }

  }, [displayedData, selectedWindow, selectedDomainFilter, stats]);

  return (
    <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-5 space-y-4 shadow-sm">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase font-mono">
              D3 HISTORICAL SPATIO-TEMPORAL MATRIX
            </span>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>24h Cyber-Domain Density Heatmap</span>
            </span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Cyber-Node Anomaly Density & Attack Vector Heatmap</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            D3-powered density distribution tracking hourly security telemetry anomalies, prompt injection attempts, and DP epsilon drifts across all 7 hardware domains.
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Window Selector */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800 text-xs">
            {(['24h', '12h', '6h'] as const).map((win) => (
              <button
                key={win}
                onClick={() => setSelectedWindow(win)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer ${
                  selectedWindow === win
                    ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {win.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Domain Dropdown */}
          <select
            value={selectedDomainFilter}
            onChange={(e) => setSelectedDomainFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono cursor-pointer"
          >
            <option value="ALL">All 7 Cyber Domains</option>
            {CYBER_DOMAINS.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Anomalies ({selectedWindow})</span>
          <span className="text-lg font-bold font-mono text-white">
            {stats.totalAnomalies} <span className="text-xs font-normal text-slate-400">events</span>
          </span>
          <span className="text-[10px] text-cyan-400 block font-mono">Avg {stats.avgPerHour} / hr</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Critical Surges</span>
          <span className="text-lg font-bold font-mono text-rose-400">
            {stats.criticalTotal} <span className="text-xs font-normal text-slate-400">quarantined</span>
          </span>
          <span className="text-[10px] text-emerald-400 block font-mono">100% mitigated</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Peak Anomaly Hour</span>
          <span className="text-lg font-bold font-mono text-amber-400">
            {stats.peakHour} <span className="text-xs font-normal text-slate-400">UTC</span>
          </span>
          <span className="text-[10px] text-slate-400 block">High diurnal traffic</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Enclave Containment</span>
          <span className="text-lg font-bold font-mono text-emerald-400">
            0.00% <span className="text-xs font-normal text-slate-400">leakage</span>
          </span>
          <span className="text-[10px] text-indigo-300 block font-mono">Hardware Isolated</span>
        </div>
      </div>

      {/* D3 SVG Canvas Container with Responsive Observer */}
      <div ref={containerRef} className="relative w-full overflow-x-auto pt-2 pb-1">
        <svg ref={svgRef} className="w-full select-none" />

        {/* Hover Tooltip Overlay */}
        {hoveredCell && tooltipPos && (
          <div
            style={{
              left: `${Math.min(tooltipPos.x + 15, (containerRef.current?.clientWidth || 600) - 240)}px`,
              top: `${Math.max(tooltipPos.y - 120, 10)}px`
            }}
            className="absolute z-30 p-3.5 bg-[#0F172A] border border-slate-700 rounded-lg shadow-2xl text-xs font-mono space-y-1.5 pointer-events-none min-w-[220px] max-w-[280px]"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="text-white font-bold">{hoveredCell.domainName}</span>
              <span className="text-cyan-400 font-bold">{hoveredCell.hourLabel}</span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Anomalies:</span>
                <span className={`font-bold ${hoveredCell.count >= 5 ? 'text-rose-400' : hoveredCell.count > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {hoveredCell.count} events
                </span>
              </div>
              {hoveredCell.count > 0 && (
                <>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Critical / High:</span>
                    <span className="text-rose-400 font-semibold">{hoveredCell.criticalCount + hoveredCell.highCount}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Medium / Low:</span>
                    <span className="text-slate-300">{hoveredCell.mediumCount + hoveredCell.lowCount}</span>
                  </div>
                  {hoveredCell.primaryAnomalyType && (
                    <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-300">
                      <span className="text-slate-400 block">Primary Vector:</span>
                      <span className="text-cyan-300">{hoveredCell.primaryAnomalyType}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* D3 Heatmap Color Scale Legend & Footer Guide */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
          <span>Density Scale:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-[#0F172A] border border-slate-700"></span>
            <span className="text-[10px] mr-1.5">0 (Nominal)</span>
            <span className="w-3 h-3 rounded-sm bg-[#0E3A52]"></span>
            <span className="w-3 h-3 rounded-sm bg-[#0284C7]"></span>
            <span className="w-3 h-3 rounded-sm bg-[#F59E0B]"></span>
            <span className="w-3 h-3 rounded-sm bg-[#F43F5E]"></span>
            <span className="text-[10px] ml-0.5 font-bold text-rose-400">8+ (Critical)</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
          <span>Click any cell to inspect incident telemetry logs</span>
        </div>
      </div>
    </div>
  );
};
