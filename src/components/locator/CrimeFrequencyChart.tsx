import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Activity,
  AlertTriangle,
  Calendar,
  Filter,
  Layers,
  MapPin,
  Flame,
  ShieldAlert,
  Send,
  Sliders,
  DollarSign,
  Maximize2
} from 'lucide-react';
import { CrimeIncident, ThreatSeverity } from '../../types';
import { formatCoordinates } from '../../utils/geoUtils';

interface CrimeFrequencyChartProps {
  crimes: CrimeIncident[];
  onSelectCrime?: (crime: CrimeIncident) => void;
  onOpenSendAlert?: (subject?: any, crime?: CrimeIncident) => void;
}

type ChartType = 'stacked-bar' | 'area' | 'line' | 'grouped-bar';
type TimeWindow = '7d' | '14d' | '30d' | 'all';
type MetricMode = 'frequency' | 'cumulative' | 'damages';

interface TimelineDataPoint {
  dateKey: string;
  displayDate: string;
  timestamp: number;
  CRITICAL: number;
  HIGH: number;
  MEDIUM: number;
  LOW: number;
  total: number;
  cumulativeTotal: number;
  cumulativeCritical: number;
  cumulativeHigh: number;
  cumulativeMedium: number;
  cumulativeLow: number;
  damagesUsd: number;
  incidents: CrimeIncident[];
}

const SEVERITY_COLORS: Record<ThreatSeverity, string> = {
  CRITICAL: '#EF4444', // Red-500
  HIGH: '#F59E0B',     // Amber-500
  MEDIUM: '#06B6D4',   // Cyan-500
  LOW: '#10B981'       // Emerald-500
};

export function CrimeFrequencyChart({
  crimes,
  onSelectCrime,
  onOpenSendAlert
}: CrimeFrequencyChartProps) {
  const [chartType, setChartType] = useState<ChartType>('stacked-bar');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('14d');
  const [metricMode, setMetricMode] = useState<MetricMode>('frequency');
  const [localityFilter, setLocalityFilter] = useState<'all' | 'village' | 'city'>('all');
  
  // Toggle severity visibility
  const [visibleSeverities, setVisibleSeverities] = useState<Record<ThreatSeverity, boolean>>({
    CRITICAL: true,
    HIGH: true,
    MEDIUM: true,
    LOW: true
  });

  // Selected date on chart for deep-dive inspection
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  // Filter crimes by locality
  const filteredCrimes = useMemo(() => {
    return crimes.filter((c) => {
      if (localityFilter === 'village' && !c.isVillage) return false;
      if (localityFilter === 'city' && c.isVillage) return false;
      return true;
    });
  }, [crimes, localityFilter]);

  // Aggregate crimes by date into structured timeline
  const timelineData = useMemo(() => {
    if (filteredCrimes.length === 0) return [];

    // Calculate time range cutoff
    const now = Date.now();
    let cutoffMs = 0;
    if (timeWindow === '7d') cutoffMs = now - 86400000 * 7;
    else if (timeWindow === '14d') cutoffMs = now - 86400000 * 14;
    else if (timeWindow === '30d') cutoffMs = now - 86400000 * 30;

    const inRangeCrimes = filteredCrimes.filter((c) => c.timestamp >= cutoffMs);

    // Group crimes by calendar date YYYY-MM-DD
    const dateMap = new Map<string, {
      dateKey: string;
      displayDate: string;
      timestamp: number;
      CRITICAL: number;
      HIGH: number;
      MEDIUM: number;
      LOW: number;
      total: number;
      damagesUsd: number;
      incidents: CrimeIncident[];
    }>();

    // Determine min and max timestamp for full continuous date range
    const timestamps = inRangeCrimes.map((c) => c.timestamp);
    const minTime = timestamps.length > 0 ? Math.min(...timestamps) : cutoffMs || (now - 86400000 * 14);
    const maxTime = Math.max(now, ...(timestamps.length > 0 ? timestamps : [now]));

    // Generate date sequence so there are no holes in the chart
    const startDay = new Date(minTime);
    startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(maxTime);
    endDay.setHours(23, 59, 59, 999);

    const curr = new Date(startDay);
    while (curr <= endDay) {
      const year = curr.getFullYear();
      const month = String(curr.getMonth() + 1).padStart(2, '0');
      const day = String(curr.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      const monthShort = curr.toLocaleString('en-US', { month: 'short' });
      const displayDate = `${monthShort} ${curr.getDate()}`;

      dateMap.set(dateKey, {
        dateKey,
        displayDate,
        timestamp: curr.getTime(),
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
        total: 0,
        damagesUsd: 0,
        incidents: []
      });

      curr.setDate(curr.getDate() + 1);
    }

    // Populate actual incidents
    inRangeCrimes.forEach((c) => {
      const d = new Date(c.timestamp);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      let entry = dateMap.get(dateKey);
      if (!entry) {
        const monthShort = d.toLocaleString('en-US', { month: 'short' });
        entry = {
          dateKey,
          displayDate: `${monthShort} ${d.getDate()}`,
          timestamp: d.getTime(),
          CRITICAL: 0,
          HIGH: 0,
          MEDIUM: 0,
          LOW: 0,
          total: 0,
          damagesUsd: 0,
          incidents: []
        };
        dateMap.set(dateKey, entry);
      }

      if (c.severity in entry) {
        entry[c.severity as ThreatSeverity]++;
      }
      entry.total++;
      entry.damagesUsd += c.estimatedDamagesUsd || 0;
      entry.incidents.push(c);
    });

    // Sort chronologically and calculate cumulative totals
    const sorted = Array.from(dateMap.values()).sort((a, b) => a.timestamp - b.timestamp);

    let cumTotal = 0;
    let cumCrit = 0;
    let cumHigh = 0;
    let cumMed = 0;
    let cumLow = 0;

    const enriched: TimelineDataPoint[] = sorted.map((pt) => {
      cumTotal += pt.total;
      cumCrit += pt.CRITICAL;
      cumHigh += pt.HIGH;
      cumMed += pt.MEDIUM;
      cumLow += pt.LOW;

      return {
        ...pt,
        cumulativeTotal: cumTotal,
        cumulativeCritical: cumCrit,
        cumulativeHigh: cumHigh,
        cumulativeMedium: cumMed,
        cumulativeLow: cumLow
      };
    });

    return enriched;
  }, [filteredCrimes, timeWindow]);

  // High-level summary metrics
  const summaryStats = useMemo(() => {
    const totalCount = timelineData.reduce((acc, curr) => acc + curr.total, 0);
    const criticalCount = timelineData.reduce((acc, curr) => acc + curr.CRITICAL, 0);
    const highCount = timelineData.reduce((acc, curr) => acc + curr.HIGH, 0);
    const mediumCount = timelineData.reduce((acc, curr) => acc + curr.MEDIUM, 0);
    const lowCount = timelineData.reduce((acc, curr) => acc + curr.LOW, 0);
    const totalDamages = timelineData.reduce((acc, curr) => acc + curr.damagesUsd, 0);

    // Peak day
    let peakDay = timelineData[0] || null;
    timelineData.forEach((pt) => {
      if (!peakDay || pt.total > peakDay.total) {
        peakDay = pt;
      }
    });

    return {
      totalCount,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      totalDamages,
      peakDay
    };
  }, [timelineData]);

  // Selected date point details
  const selectedPoint = useMemo(() => {
    if (!selectedDateKey) return null;
    return timelineData.find((pt) => pt.dateKey === selectedDateKey) || null;
  }, [timelineData, selectedDateKey]);

  // Toggle single severity
  const toggleSeverity = (sev: ThreatSeverity) => {
    setVisibleSeverities((prev) => ({
      ...prev,
      [sev]: !prev[sev]
    }));
  };

  // Custom Cyber Tooltip Component for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data: TimelineDataPoint = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-[#0B0F17] border border-cyan-500/50 rounded-xl p-3.5 shadow-2xl shadow-cyan-950/50 font-mono text-xs max-w-xs backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            {data.displayDate}
          </span>
          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
            {metricMode === 'cumulative' ? `${data.cumulativeTotal} Total` : `${data.total} Incidents`}
          </span>
        </div>

        <div className="space-y-1.5">
          {visibleSeverities.CRITICAL && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Critical:
              </span>
              <span className="font-bold text-white">
                {metricMode === 'cumulative' ? data.cumulativeCritical : data.CRITICAL}
              </span>
            </div>
          )}

          {visibleSeverities.HIGH && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                High:
              </span>
              <span className="font-bold text-white">
                {metricMode === 'cumulative' ? data.cumulativeHigh : data.HIGH}
              </span>
            </div>
          )}

          {visibleSeverities.MEDIUM && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                Medium:
              </span>
              <span className="font-bold text-white">
                {metricMode === 'cumulative' ? data.cumulativeMedium : data.MEDIUM}
              </span>
            </div>
          )}

          {visibleSeverities.LOW && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Low:
              </span>
              <span className="font-bold text-white">
                {metricMode === 'cumulative' ? data.cumulativeLow : data.LOW}
              </span>
            </div>
          )}

          {data.damagesUsd > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1 text-slate-400">
                <DollarSign className="w-3 h-3 text-emerald-400" />
                Est. Damages:
              </span>
              <span className="font-bold text-emerald-400">
                ${(data.damagesUsd / 1_000_000).toFixed(2)}M
              </span>
            </div>
          )}

          {data.incidents.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                Recorded Incidents:
              </div>
              <ul className="space-y-1">
                {data.incidents.slice(0, 3).map((inc) => (
                  <li key={inc.id} className="truncate text-slate-300">
                    • {inc.title}
                  </li>
                ))}
                {data.incidents.length > 3 && (
                  <li className="text-cyan-400 text-[10px]">
                    +{data.incidents.length - 3} more incidents
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-2 pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-500 italic text-center">
          Click bar or point to inspect incidents below
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
      {/* Top Header & Telemetry Badges */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                CRIME INCIDENT FREQUENCY OVER TIME
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Multi-Severity Tactical Frequency Distribution & Trend Telemetry
              </p>
            </div>
          </div>
        </div>

        {/* View Controls & Selectors */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {/* Chart Type Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setChartType('stacked-bar')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                chartType === 'stacked-bar'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Stacked Bar Chart"
            >
              Stacked Bar
            </button>
            <button
              onClick={() => setChartType('grouped-bar')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                chartType === 'grouped-bar'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Grouped Bar Chart"
            >
              Grouped
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                chartType === 'area'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Stacked Area Streamgraph"
            >
              Area Stream
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                chartType === 'line'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Multi-Line Trend"
            >
              Line Trend
            </button>
          </div>

          {/* Time Window Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setTimeWindow('7d')}
              className={`px-2 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                timeWindow === '7d' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              7D
            </button>
            <button
              onClick={() => setTimeWindow('14d')}
              className={`px-2 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                timeWindow === '14d' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              14D
            </button>
            <button
              onClick={() => setTimeWindow('30d')}
              className={`px-2 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                timeWindow === '30d' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              30D
            </button>
            <button
              onClick={() => setTimeWindow('all')}
              className={`px-2 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                timeWindow === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setMetricMode('frequency')}
              className={`px-2 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                metricMode === 'frequency'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setMetricMode('cumulative')}
              className={`px-2 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                metricMode === 'cumulative'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cumulative
            </button>
          </div>

          {/* Locality Filter */}
          <select
            value={localityFilter}
            onChange={(e) => setLocalityFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">All Localities</option>
            <option value="village">🏡 Villages Only</option>
            <option value="city">🏢 Cities Only</option>
          </select>
        </div>
      </div>

      {/* Real-Time Statistical Badges Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Incidents */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Total In Window
          </div>
          <div className="text-xl font-extrabold text-white font-mono mt-1">
            {summaryStats.totalCount}
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
            {timeWindow === 'all' ? 'All records' : `Past ${timeWindow.replace('d', ' days')}`}
          </div>
        </div>

        {/* Critical Severity Card */}
        <div
          onClick={() => toggleSeverity('CRITICAL')}
          className={`bg-slate-900/80 border rounded-xl p-3 cursor-pointer transition ${
            visibleSeverities.CRITICAL
              ? 'border-red-500/50 bg-red-950/10'
              : 'border-slate-800 opacity-50'
          }`}
          title="Click to toggle Critical incidents on chart"
        >
          <div className="text-[11px] font-mono text-red-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Critical
            </span>
            <span className="text-[10px] text-slate-500">{visibleSeverities.CRITICAL ? 'ON' : 'OFF'}</span>
          </div>
          <div className="text-xl font-extrabold text-red-400 font-mono mt-1">
            {summaryStats.criticalCount}
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
            {summaryStats.totalCount > 0
              ? `${Math.round((summaryStats.criticalCount / summaryStats.totalCount) * 100)}% of total`
              : '0%'}
          </div>
        </div>

        {/* High Severity Card */}
        <div
          onClick={() => toggleSeverity('HIGH')}
          className={`bg-slate-900/80 border rounded-xl p-3 cursor-pointer transition ${
            visibleSeverities.HIGH
              ? 'border-amber-500/50 bg-amber-950/10'
              : 'border-slate-800 opacity-50'
          }`}
          title="Click to toggle High incidents on chart"
        >
          <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              High
            </span>
            <span className="text-[10px] text-slate-500">{visibleSeverities.HIGH ? 'ON' : 'OFF'}</span>
          </div>
          <div className="text-xl font-extrabold text-amber-400 font-mono mt-1">
            {summaryStats.highCount}
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
            {summaryStats.totalCount > 0
              ? `${Math.round((summaryStats.highCount / summaryStats.totalCount) * 100)}% of total`
              : '0%'}
          </div>
        </div>

        {/* Medium Severity Card */}
        <div
          onClick={() => toggleSeverity('MEDIUM')}
          className={`bg-slate-900/80 border rounded-xl p-3 cursor-pointer transition ${
            visibleSeverities.MEDIUM
              ? 'border-cyan-500/50 bg-cyan-950/10'
              : 'border-slate-800 opacity-50'
          }`}
          title="Click to toggle Medium incidents on chart"
        >
          <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              Medium
            </span>
            <span className="text-[10px] text-slate-500">{visibleSeverities.MEDIUM ? 'ON' : 'OFF'}</span>
          </div>
          <div className="text-xl font-extrabold text-cyan-400 font-mono mt-1">
            {summaryStats.mediumCount}
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
            {summaryStats.totalCount > 0
              ? `${Math.round((summaryStats.mediumCount / summaryStats.totalCount) * 100)}% of total`
              : '0%'}
          </div>
        </div>

        {/* Low Severity Card */}
        <div
          onClick={() => toggleSeverity('LOW')}
          className={`bg-slate-900/80 border rounded-xl p-3 cursor-pointer transition ${
            visibleSeverities.LOW
              ? 'border-emerald-500/50 bg-emerald-950/10'
              : 'border-slate-800 opacity-50'
          }`}
          title="Click to toggle Low incidents on chart"
        >
          <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Low
            </span>
            <span className="text-[10px] text-slate-500">{visibleSeverities.LOW ? 'ON' : 'OFF'}</span>
          </div>
          <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
            {summaryStats.lowCount}
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
            {summaryStats.totalCount > 0
              ? `${Math.round((summaryStats.lowCount / summaryStats.totalCount) * 100)}% of total`
              : '0%'}
          </div>
        </div>

        {/* Peak Velocity / Damages */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            Total Damages
          </div>
          <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
            ${(summaryStats.totalDamages / 1_000_000).toFixed(1)}M
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
            Peak: {summaryStats.peakDay?.displayDate} ({summaryStats.peakDay?.total} acts)
          </div>
        </div>
      </div>

      {/* Interactive Severity Legend and Click Hint */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-slate-500 text-[11px]">FILTER SEVERITY LAYER:</span>
          
          <button
            onClick={() => toggleSeverity('CRITICAL')}
            className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded border transition ${
              visibleSeverities.CRITICAL
                ? 'bg-red-500/20 text-red-300 border-red-500/40 font-bold'
                : 'bg-slate-900 text-slate-500 border-slate-800 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
            <span>CRITICAL</span>
          </button>

          <button
            onClick={() => toggleSeverity('HIGH')}
            className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded border transition ${
              visibleSeverities.HIGH
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                : 'bg-slate-900 text-slate-500 border-slate-800 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span>HIGH</span>
          </button>

          <button
            onClick={() => toggleSeverity('MEDIUM')}
            className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded border transition ${
              visibleSeverities.MEDIUM
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                : 'bg-slate-900 text-slate-500 border-slate-800 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
            <span>MEDIUM</span>
          </button>

          <button
            onClick={() => toggleSeverity('LOW')}
            className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded border transition ${
              visibleSeverities.LOW
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                : 'bg-slate-900 text-slate-500 border-slate-800 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span>LOW</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-cyan-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {selectedDateKey
              ? `Filtered Date: ${selectedPoint?.displayDate} (${selectedPoint?.total} incidents) - Click chart again to clear`
              : 'Tip: Click any bar or data point to inspect that date'}
          </span>
          {selectedDateKey && (
            <button
              onClick={() => setSelectedDateKey(null)}
              className="text-slate-400 hover:text-white underline ml-1"
            >
              [Reset]
            </button>
          )}
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="h-72 sm:h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart
              data={timelineData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  const pt = e.activePayload[0].payload as TimelineDataPoint;
                  setSelectedDateKey((prev) => (prev === pt.dateKey ? null : pt.dateKey));
                }
              }}
            >
              <defs>
                <linearGradient id="colorCrit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SEVERITY_COLORS.CRITICAL} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={SEVERITY_COLORS.CRITICAL} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SEVERITY_COLORS.HIGH} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={SEVERITY_COLORS.HIGH} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="colorMed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SEVERITY_COLORS.MEDIUM} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={SEVERITY_COLORS.MEDIUM} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SEVERITY_COLORS.LOW} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={SEVERITY_COLORS.LOW} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {visibleSeverities.LOW && (
                <Area
                  type="monotone"
                  dataKey={metricMode === 'cumulative' ? 'cumulativeLow' : 'LOW'}
                  name="Low"
                  stackId="1"
                  stroke={SEVERITY_COLORS.LOW}
                  fill="url(#colorLow)"
                />
              )}
              {visibleSeverities.MEDIUM && (
                <Area
                  type="monotone"
                  dataKey={metricMode === 'cumulative' ? 'cumulativeMedium' : 'MEDIUM'}
                  name="Medium"
                  stackId="1"
                  stroke={SEVERITY_COLORS.MEDIUM}
                  fill="url(#colorMed)"
                />
              )}
              {visibleSeverities.HIGH && (
                <Area
                  type="monotone"
                  dataKey={metricMode === 'cumulative' ? 'cumulativeHigh' : 'HIGH'}
                  name="High"
                  stackId="1"
                  stroke={SEVERITY_COLORS.HIGH}
                  fill="url(#colorHigh)"
                />
              )}
              {visibleSeverities.CRITICAL && (
                <Area
                  type="monotone"
                  dataKey={metricMode === 'cumulative' ? 'cumulativeCritical' : 'CRITICAL'}
                  name="Critical"
                  stackId="1"
                  stroke={SEVERITY_COLORS.CRITICAL}
                  fill="url(#colorCrit)"
                />
              )}
            </AreaChart>
          ) : chartType === 'line' ? (
            <LineChart
              data={timelineData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  const pt = e.activePayload[0].payload as TimelineDataPoint;
                  setSelectedDateKey((prev) => (prev === pt.dateKey ? null : pt.dateKey));
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {visibleSeverities.CRITICAL && (
                <Line
                  type="monotone"
                  dataKey={metricMode === 'cumulative' ? 'cumulativeCritical' : 'CRITICAL'}
                  name="Critical"
                  stroke={SEVERITY_COLORS.CRITICAL}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: SEVERITY_COLORS.CRITICAL }}
                  activeDot={{ r: 6, stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              )}
              {visibleSeverities.HIGH && (
                <Line
                  type="monotone"
                  dataKey={metricMode === 'cumulative' ? 'cumulativeHigh' : 'HIGH'}
                  name="High"
                  stroke={SEVERITY_COLORS.HIGH}
                  strokeWidth={2}
                  dot={{ r: 3, fill: SEVERITY_COLORS.HIGH }}
                  activeDot={{ r: 6, stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              )}
              {visibleSeverities.MEDIUM && (
                <Line
                  type="monotone"
                  dataKey={metricMode === 'cumulative' ? 'cumulativeMedium' : 'MEDIUM'}
                  name="Medium"
                  stroke={SEVERITY_COLORS.MEDIUM}
                  strokeWidth={2}
                  dot={{ r: 3, fill: SEVERITY_COLORS.MEDIUM }}
                  activeDot={{ r: 6, stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              )}
              {visibleSeverities.LOW && (
                <Line
                  type="monotone"
                  dataKey={metricMode === 'cumulative' ? 'cumulativeLow' : 'LOW'}
                  name="Low"
                  stroke={SEVERITY_COLORS.LOW}
                  strokeWidth={1.5}
                  dot={{ r: 3, fill: SEVERITY_COLORS.LOW }}
                  activeDot={{ r: 6, stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              )}
              {metricMode === 'frequency' && (
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total Trend"
                  stroke="#E2E8F0"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              )}
            </LineChart>
          ) : (
            <BarChart
              data={timelineData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  const pt = e.activePayload[0].payload as TimelineDataPoint;
                  setSelectedDateKey((prev) => (prev === pt.dateKey ? null : pt.dateKey));
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
              {visibleSeverities.CRITICAL && (
                <Bar
                  dataKey={metricMode === 'cumulative' ? 'cumulativeCritical' : 'CRITICAL'}
                  name="Critical"
                  stackId={chartType === 'stacked-bar' ? 'a' : undefined}
                  fill={SEVERITY_COLORS.CRITICAL}
                  radius={chartType === 'stacked-bar' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                />
              )}
              {visibleSeverities.HIGH && (
                <Bar
                  dataKey={metricMode === 'cumulative' ? 'cumulativeHigh' : 'HIGH'}
                  name="High"
                  stackId={chartType === 'stacked-bar' ? 'a' : undefined}
                  fill={SEVERITY_COLORS.HIGH}
                  radius={chartType === 'stacked-bar' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                />
              )}
              {visibleSeverities.MEDIUM && (
                <Bar
                  dataKey={metricMode === 'cumulative' ? 'cumulativeMedium' : 'MEDIUM'}
                  name="Medium"
                  stackId={chartType === 'stacked-bar' ? 'a' : undefined}
                  fill={SEVERITY_COLORS.MEDIUM}
                  radius={chartType === 'stacked-bar' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                />
              )}
              {visibleSeverities.LOW && (
                <Bar
                  dataKey={metricMode === 'cumulative' ? 'cumulativeLow' : 'LOW'}
                  name="Low"
                  stackId={chartType === 'stacked-bar' ? 'a' : undefined}
                  fill={SEVERITY_COLORS.LOW}
                  radius={chartType === 'stacked-bar' ? [4, 4, 0, 0] : [4, 4, 0, 0]}
                />
              )}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Selected Date Detail Drawer or Active Cases Listing */}
      <div className="border-t border-slate-800 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              {selectedPoint
                ? `CRIME INCIDENTS ON ${selectedPoint.displayDate} (${selectedPoint.incidents.length} RECORDS)`
                : `RECENT RECORDED CRIME INCIDENTS (${filteredCrimes.length} TOTAL IN SCOPE)`}
            </h3>
          </div>
          {selectedDateKey && (
            <button
              onClick={() => setSelectedDateKey(null)}
              className="text-xs text-cyan-400 hover:underline font-mono"
            >
              Show All Recorded Dates →
            </button>
          )}
        </div>

        {/* Display Incidents List */}
        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
          {((selectedPoint ? selectedPoint.incidents : filteredCrimes.slice(0, 6))).map((crime) => (
            <div
              key={crime.id}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 hover:border-cyan-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      crime.severity === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : crime.severity === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : crime.severity === 'MEDIUM'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}
                  >
                    {crime.severity}
                  </span>
                  <span className="text-xs font-bold text-white font-mono">
                    {crime.caseNumber}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    • {crime.dateFormatted}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    • {crime.cityOrVillage}, {crime.country} {crime.isVillage ? '🏡 (Village)' : '🏢 (City)'}
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-medium line-clamp-1">
                  {crime.title}
                </div>
                <div className="text-[11px] text-slate-400 font-mono line-clamp-1">
                  {crime.description}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {crime.estimatedDamagesUsd && (
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/20">
                    ${(crime.estimatedDamagesUsd / 1_000_000).toFixed(1)}M
                  </span>
                )}
                {onSelectCrime && (
                  <button
                    onClick={() => onSelectCrime(crime)}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-1"
                    title="Inspect incident on SeekMap"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Locate</span>
                  </button>
                )}
                {onOpenSendAlert && (
                  <button
                    onClick={() => onOpenSendAlert(undefined, crime)}
                    className="px-2.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/40 text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-1"
                    title="Dispatch alert for this crime"
                  >
                    <Send className="w-3 h-3" />
                    <span>Alert</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
