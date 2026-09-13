import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Flame,
  ShieldAlert,
  Sliders,
  Radio,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Eye,
  Activity,
  Send,
  ExternalLink,
  Layers,
  BarChart3,
  TrendingUp,
  Maximize2
} from 'lucide-react';
import { CrimeIncident, SubjectIdentity, DispatchedLawEnforcementAlert } from '../../types';
import { latLngToCanvasXY, formatCoordinates, calculateDistanceKm } from '../../utils/geoUtils';
import {
  HazardHeatmapSvgLayer
} from './HazardHeatmapSvgLayer';
import {
  HeatmapPalette,
  HeatmapWeightMode,
  HazardCluster,
  LiveSensorPing,
  SAMPLE_LIVE_SENSOR_PINGS,
  detectHazardClusters
} from '../../utils/heatmapD3Utils';

interface HazardHeatmapPanelProps {
  crimes: CrimeIncident[];
  subjects: SubjectIdentity[];
  onSelectCrime?: (crime: CrimeIncident) => void;
  onOpenSendAlert?: (subject?: SubjectIdentity, crime?: CrimeIncident) => void;
  onCenterMapCoordinates?: (coords: [number, number], zoom?: number) => void;
}

export function HazardHeatmapPanel({
  crimes,
  subjects,
  onSelectCrime,
  onOpenSendAlert,
  onCenterMapCoordinates
}: HazardHeatmapPanelProps) {
  // D3 Heatmap Configuration States
  const [bandwidth, setBandwidth] = useState<number>(38);
  const [thresholdCount, setThresholdCount] = useState<number>(12);
  const [weightMode, setWeightMode] = useState<HeatmapWeightMode>('severity');
  const [palette, setPalette] = useState<HeatmapPalette>('crimsonHazard');
  const [opacity, setOpacity] = useState<number>(0.72);
  const [showClusters, setShowClusters] = useState<boolean>(true);
  const [showIncidentMarkers, setShowIncidentMarkers] = useState<boolean>(true);

  // Selected cluster
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);

  // Filter state
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH'>('ALL');
  const [localityFilter, setLocalityFilter] = useState<'ALL' | 'VILLAGE' | 'CITY'>('ALL');

  // Real-Time Live Sensor Stream Simulation
  const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(true);
  const [livePings, setLivePings] = useState<LiveSensorPing[]>([]);
  const [liveEventLog, setLiveEventLog] = useState<Array<{ id: string; time: string; message: string; source: string; intensity: number }>>([]);

  // Map Pan and Zoom state
  const [zoom, setZoom] = useState(1.1);
  const [pan, setPan] = useState({ x: -40, y: -20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoverCoord, setHoverCoord] = useState<[number, number] | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Filtered crimes for heatmap calculation
  const filteredCrimes = useMemo(() => {
    return crimes.filter((c) => {
      if (severityFilter === 'CRITICAL' && c.severity !== 'CRITICAL') return false;
      if (severityFilter === 'HIGH' && (c.severity !== 'CRITICAL' && c.severity !== 'HIGH')) return false;
      if (localityFilter === 'VILLAGE' && !c.isVillage) return false;
      if (localityFilter === 'CITY' && c.isVillage) return false;
      return true;
    });
  }, [crimes, severityFilter, localityFilter]);

  // Detected clusters
  const clusters = useMemo(() => {
    return detectHazardClusters(filteredCrimes);
  }, [filteredCrimes]);

  const selectedCluster = useMemo(() => {
    return clusters.find((cl) => cl.id === selectedClusterId) || null;
  }, [clusters, selectedClusterId]);

  // Real-time sensor stream effect (simulates live hazard telemetry every 4 seconds)
  useEffect(() => {
    if (!isLiveStreamActive) {
      setLivePings([]);
      return;
    }

    let pingIndex = 0;
    const interval = setInterval(() => {
      const sample = SAMPLE_LIVE_SENSOR_PINGS[pingIndex % SAMPLE_LIVE_SENSOR_PINGS.length];
      const newPing: LiveSensorPing = {
        id: `PING-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        lat: sample.lat + (Math.random() - 0.5) * 0.1,
        lng: sample.lng + (Math.random() - 0.5) * 0.1,
        x: sample.x + (Math.random() - 0.5) * 10,
        y: sample.y + (Math.random() - 0.5) * 10,
        label: sample.label,
        intensity: sample.intensity,
        timestamp: Date.now(),
        source: sample.source
      };

      setLivePings((prev) => [newPing, ...prev.slice(0, 3)]);

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      setLiveEventLog((prev) => [
        {
          id: newPing.id,
          time: timeStr,
          message: `${sample.label} (${formatCoordinates([newPing.lat, newPing.lng])})`,
          source: sample.source,
          intensity: sample.intensity
        },
        ...prev.slice(0, 7)
      ]);

      pingIndex++;
    }, 4000);

    return () => clearInterval(interval);
  }, [isLiveStreamActive]);

  // Map mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const canvasX = (mouseX - pan.x) / zoom;
      const canvasY = (mouseY - pan.y) / zoom;

      const lng = (canvasX / 1000) * 360 - 180;
      const lat = 90 - (canvasY / 500) * 180;

      if (lat >= -85 && lat <= 85 && lng >= -180 && lng <= 180) {
        setHoverCoord([Math.round(lat * 10000) / 10000, Math.round(lng * 10000) / 10000]);
      }
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((z) => Math.max(0.8, Math.min(6, z * zoomFactor)));
  };

  // Center map on a specific cluster
  const handleFocusCluster = (cluster: HazardCluster) => {
    setSelectedClusterId(cluster.id);
    const targetZoom = 2.4;
    setZoom(targetZoom);
    setPan({
      x: 500 - cluster.centroidX * targetZoom,
      y: 250 - cluster.centroidY * targetZoom
    });
  };

  // Reset view
  const handleResetView = () => {
    setZoom(1.1);
    setPan({ x: -40, y: -20 });
    setSelectedClusterId(null);
  };

  // Top summary stats
  const totalDamages = useMemo(() => {
    return filteredCrimes.reduce((acc, c) => acc + (c.estimatedDamagesUsd || 0), 0);
  }, [filteredCrimes]);

  const peakCluster = clusters[0];

  return (
    <div className="space-y-6">
      {/* Top Header & Overview Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40">
                <Flame className="w-4 h-4 animate-pulse" />
              </span>
              <span className="text-[11px] font-mono font-bold tracking-widest text-red-400 uppercase">
                D3.JS GEODETIC DENSITY ENGINE • 2D KERNEL DENSITY ESTIMATION
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white font-mono tracking-tight">
              Real-Time Hazard Heatmap & Incident Clusters
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1 max-w-3xl">
              Continuous multi-threshold contour density mapping across global geocoordinates. Isolates multi-jurisdiction criminal nexus points and visualizes dynamic threat dispersion.
            </p>
          </div>

          {/* Quick Actions & Live Stream Switch */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsLiveStreamActive(!isLiveStreamActive)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition flex items-center gap-2 cursor-pointer ${
                isLiveStreamActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-950/40'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isLiveStreamActive ? 'text-emerald-400 animate-pulse' : ''}`} />
              <span>LIVE SENSOR STREAM: {isLiveStreamActive ? 'ACTIVE' : 'STANDBY'}</span>
            </button>

            {onOpenSendAlert && (
              <button
                onClick={() => onOpenSendAlert()}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-red-600 hover:bg-red-500 text-white transition flex items-center gap-2 shadow-lg shadow-red-950/40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Broadcast Threat Alert</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-time Summary Cards Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Identified Clusters</span>
            </div>
            <div className="text-xl font-mono font-bold text-white mt-1">
              {clusters.length} <span className="text-xs text-cyan-400 font-normal">Active Corridors</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span>Peak Threat Epicenter</span>
            </div>
            <div className="text-xl font-mono font-bold text-red-400 mt-1 flex items-center gap-2">
              <span>{peakCluster ? `${peakCluster.shortName} (${peakCluster.threatScore}%)` : 'N/A'}</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Hotspot Financial Exposure</span>
            </div>
            <div className="text-xl font-mono font-bold text-amber-300 mt-1">
              ${(totalDamages / 1000000).toFixed(1)}M <span className="text-xs text-slate-400 font-normal">Damages</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real-Time Sensor Feeds</span>
            </div>
            <div className="text-xl font-mono font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
              <span>{isLiveStreamActive ? `${livePings.length} Signals` : '0 Inactive'}</span>
              {isLiveStreamActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive D3 Heatmap Map Canvas Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Map Header Controls Bar */}
        <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Density legend and active coords */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-red-400" />
                <span>D3 HAZARD OVERLAY</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-mono">
                {weightMode.toUpperCase()} WEIGHTED
              </span>
            </div>

            {/* Quick Calibrated Density Legend */}
            <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-slate-400 pl-3 border-l border-slate-800">
              <span>LOW</span>
              <div className="w-20 h-2 rounded-full bg-gradient-to-r from-cyan-500 via-amber-400 via-orange-500 to-red-600" />
              <span className="text-red-400 font-bold">CRITICAL HAZARD</span>
            </div>
          </div>

          {/* Right: Quick Zoom, Reset, Marker toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowIncidentMarkers(!showIncidentMarkers)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1 ${
                showIncidentMarkers ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>Markers</span>
            </button>

            <button
              onClick={() => setShowClusters(!showClusters)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1 ${
                showClusters ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>Clusters</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 p-1 rounded-lg">
              <button
                onClick={() => setZoom((z) => Math.min(6, z * 1.3))}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.8, z / 1.3))}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetView}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition cursor-pointer"
                title="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Interactive SVG Map Viewport */}
        <div
          ref={containerRef}
          className="w-full h-[460px] sm:h-[520px] bg-[#0A0F1D] relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Subtle Scanline Overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />

          <svg
            viewBox="0 0 1000 500"
            className="w-full h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out'
            }}
          >
            {/* Background Grid Pattern */}
            <defs>
              <pattern id="heatmapGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1E293B" strokeWidth="0.8" strokeDasharray="2,4" />
              </pattern>
            </defs>

            <rect width="1000" height="500" fill="#090E1A" />
            <rect width="1000" height="500" fill="url(#heatmapGrid)" />

            {/* Latitude & Longitude Meridians */}
            <line x1="0" y1="250" x2="1000" y2="250" stroke="#334155" strokeWidth="0.8" strokeDasharray="4,6" opacity="0.4" />
            <line x1="500" y1="0" x2="500" y2="500" stroke="#334155" strokeWidth="0.8" strokeDasharray="4,6" opacity="0.4" />

            {/* World Continents Vector Base (Low-poly tactical geo shapes) */}
            <g fill="#141E33" stroke="#1E3A5F" strokeWidth="1" opacity="0.7">
              {/* North America */}
              <path d="M 120 70 L 260 70 L 320 120 L 290 180 L 250 200 L 220 280 L 190 260 L 150 210 L 110 160 Z" />
              {/* South America */}
              <path d="M 250 290 L 320 310 L 350 370 L 320 460 L 280 470 L 260 380 L 240 320 Z" />
              {/* Europe */}
              <path d="M 460 70 L 580 80 L 560 140 L 510 170 L 460 160 L 440 120 Z" />
              {/* Africa */}
              <path d="M 460 180 L 570 190 L 610 260 L 590 380 L 540 430 L 480 370 L 440 260 Z" />
              {/* Asia */}
              <path d="M 580 70 L 850 80 L 880 160 L 820 260 L 710 280 L 630 220 L 570 140 Z" />
              {/* Australia */}
              <path d="M 760 340 L 880 340 L 890 420 L 800 440 L 750 390 Z" />
            </g>

            {/* D3 HAZARD HEATMAP CONTOUR LAYER */}
            <HazardHeatmapSvgLayer
              crimes={filteredCrimes}
              livePings={livePings}
              bandwidth={bandwidth}
              thresholds={thresholdCount}
              weightMode={weightMode}
              palette={palette}
              opacity={opacity}
              showContours={true}
              showClusters={showClusters}
              selectedClusterId={selectedClusterId}
              onSelectCluster={(cl) => setSelectedClusterId(cl.id)}
            />

            {/* Optional Crime Markers for direct interaction */}
            {showIncidentMarkers &&
              filteredCrimes.map((crime) => {
                const pos = latLngToCanvasXY(crime.coordinates[0], crime.coordinates[1]);
                const isCritical = crime.severity === 'CRITICAL';
                return (
                  <g
                    key={crime.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCrime?.(crime);
                    }}
                  >
                    <circle
                      r="4.5"
                      fill={isCritical ? '#EF4444' : '#F59E0B'}
                      stroke="#FFFFFF"
                      strokeWidth="1.2"
                    />
                  </g>
                );
              })}
          </svg>

          {/* Realtime Coordinate & Telemetry HUD Overlay */}
          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 flex items-center gap-3 shadow-lg pointer-events-none">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Compass className="w-3.5 h-3.5" />
              <span>CURSOR:</span>
              <span className="text-white">
                {hoverCoord ? formatCoordinates(hoverCoord) : 'SEARCHING RADAR GRID...'}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400 border-l border-slate-700 pl-3">
              <span>ZOOM:</span>
              <span className="text-cyan-400">{zoom.toFixed(1)}x</span>
            </div>
          </div>

          {/* Selected Cluster Floating Quick Card */}
          {selectedCluster && (
            <div className="absolute top-3 right-3 max-w-xs bg-slate-950/95 backdrop-blur border border-cyan-500/50 rounded-xl p-3.5 shadow-2xl text-xs font-mono text-slate-200">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-bold text-cyan-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                  {selectedCluster.shortName}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  selectedCluster.threatLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {selectedCluster.threatLevel} ({selectedCluster.threatScore}%)
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-bold mb-1">
                {selectedCluster.codename}
              </div>
              <div className="text-[10px] text-slate-400 space-y-0.5">
                <div>Centroid: {formatCoordinates([selectedCluster.centroidLat, selectedCluster.centroidLng])}</div>
                <div>Incidents: {selectedCluster.incidentCount} ({selectedCluster.criticalCount} Critical)</div>
                <div>Damages: ${(selectedCluster.totalDamagesUsd / 1000000).toFixed(1)}M USD</div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleFocusCluster(selectedCluster)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-cyan-300 cursor-pointer"
                >
                  Center View
                </button>
                {onOpenSendAlert && (
                  <button
                    onClick={() => onOpenSendAlert(undefined, selectedCluster.incidents[0])}
                    className="px-2 py-1 rounded bg-red-600/80 hover:bg-red-500 text-[11px] text-white cursor-pointer"
                  >
                    Broadcast Alert
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* D3 Heatmap Engine Tuning Control Panel */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              D3 Heatmap Kernel & Visual Parameters
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Bandwidth / Dispersion Slider */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
              <div className="flex justify-between items-center text-xs font-mono text-slate-300 mb-1.5">
                <span className="text-slate-400">Kernel Bandwidth (Radius):</span>
                <span className="text-cyan-400 font-bold">{bandwidth}px</span>
              </div>
              <input
                type="range"
                min="20"
                max="65"
                step="2"
                value={bandwidth}
                onChange={(e) => setBandwidth(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>Local Hotspots (20px)</span>
                <span>Continental (65px)</span>
              </div>
            </div>

            {/* Density Weighting Mode */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
              <div className="text-xs font-mono text-slate-400 mb-1.5">Density Weighting Metric:</div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setWeightMode('severity')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                    weightMode === 'severity'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Severity
                </button>
                <button
                  onClick={() => setWeightMode('flat')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                    weightMode === 'flat'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Flat Count
                </button>
                <button
                  onClick={() => setWeightMode('damages')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                    weightMode === 'damages'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Damages
                </button>
              </div>
            </div>

            {/* Color Palette Selector */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
              <div className="text-xs font-mono text-slate-400 mb-1.5">Thermal Palette:</div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setPalette('crimsonHazard')}
                  className={`py-1 px-2 rounded text-[10px] font-mono transition cursor-pointer ${
                    palette === 'crimsonHazard'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Tactical Hazard
                </button>
                <button
                  onClick={() => setPalette('inferno')}
                  className={`py-1 px-2 rounded text-[10px] font-mono transition cursor-pointer ${
                    palette === 'inferno'
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Inferno D3
                </button>
                <button
                  onClick={() => setPalette('turbo')}
                  className={`py-1 px-2 rounded text-[10px] font-mono transition cursor-pointer ${
                    palette === 'turbo'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Spectral Turbo
                </button>
                <button
                  onClick={() => setPalette('plasma')}
                  className={`py-1 px-2 rounded text-[10px] font-mono transition cursor-pointer ${
                    palette === 'plasma'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Plasma D3
                </button>
              </div>
            </div>

            {/* Opacity & Thresholds */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
              <div className="flex justify-between items-center text-xs font-mono text-slate-300 mb-1">
                <span className="text-slate-400">Contour Opacity:</span>
                <span className="text-cyan-400 font-bold">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.95"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between items-center text-xs font-mono text-slate-300 mt-2">
                <span className="text-slate-400">Contour Steps:</span>
                <span className="text-cyan-400 font-bold">{thresholdCount} levels</span>
              </div>
              <input
                type="range"
                min="6"
                max="18"
                step="2"
                value={thresholdCount}
                onChange={(e) => setThresholdCount(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Detected Geographic Density Clusters (D3 Classified) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-mono font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <span>D3 Identified Crime Density Clusters ({clusters.length})</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Automated spatial density clustering isolating multi-incident regional hazard hubs.
            </p>
          </div>

          {/* Quick Filter */}
          <div className="flex items-center gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 px-3 py-1.5 rounded-lg outline-none cursor-pointer"
            >
              <option value="ALL">All Threat Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High & Critical</option>
            </select>

            <select
              value={localityFilter}
              onChange={(e) => setLocalityFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 px-3 py-1.5 rounded-lg outline-none cursor-pointer"
            >
              <option value="ALL">All Localities</option>
              <option value="VILLAGE">Villages Only</option>
              <option value="CITY">Cities Only</option>
            </select>
          </div>
        </div>

        {/* Clusters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clusters.map((cluster) => {
            const isSelected = selectedClusterId === cluster.id;
            const isCritical = cluster.threatLevel === 'CRITICAL';
            const isHigh = cluster.threatLevel === 'HIGH';

            return (
              <div
                key={cluster.id}
                className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-950 border-cyan-500/80 shadow-lg shadow-cyan-950/40'
                    : isCritical
                    ? 'bg-slate-950/70 border-red-500/30 hover:border-red-500/60'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                      {cluster.shortName}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                      isCritical
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : isHigh
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}>
                      THREAT INDEX: {cluster.threatScore}%
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white font-mono leading-tight mb-1">
                    {cluster.codename}
                  </h4>
                  <div className="text-xs text-slate-400 font-mono mb-3">
                    Region: <span className="text-slate-300">{cluster.geographicRegion}</span> • Centroid: <span className="text-cyan-400">{formatCoordinates([cluster.centroidLat, cluster.centroidLng])}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 px-2.5 bg-slate-900/80 rounded-lg text-center text-xs font-mono mb-3 border border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-400">Incidents</div>
                      <div className="text-white font-bold">{cluster.incidentCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Critical</div>
                      <div className="text-red-400 font-bold">{cluster.criticalCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Exposure</div>
                      <div className="text-amber-300 font-bold">${(cluster.totalDamagesUsd / 1000000).toFixed(1)}M</div>
                    </div>
                  </div>

                  {/* Incident Items inside Cluster */}
                  <div className="space-y-1.5 mb-3">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Linked Hotspot Incidents:</div>
                    {cluster.incidents.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => onSelectCrime?.(c)}
                        className="p-2 rounded bg-slate-900/60 hover:bg-slate-900 text-[11px] font-mono text-slate-300 border border-slate-800/60 cursor-pointer flex items-center justify-between gap-2"
                      >
                        <span className="truncate">
                          <span className="text-cyan-400 font-bold">{c.caseNumber}</span> • {c.cityOrVillage}
                        </span>
                        <span className={`text-[10px] font-bold ${
                          c.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'
                        }`}>
                          {c.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleFocusCluster(cluster)}
                    className="flex-1 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Focus Map</span>
                  </button>

                  {onOpenSendAlert && (
                    <button
                      onClick={() => onOpenSendAlert(undefined, cluster.incidents[0])}
                      className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Alert</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Hazard Sensor Intercepts Stream */}
      {isLiveStreamActive && liveEventLog.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Real-Time Surveillance Intercepts Telemetry Stream
              </h4>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">
              BUFFER: {liveEventLog.length} EVENTS RECORDED
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-xs max-h-40 overflow-y-auto pr-1">
            {liveEventLog.map((log) => (
              <div
                key={log.id}
                className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3 text-slate-300"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[10px]">{log.time}</span>
                  <span className="text-cyan-400 font-bold text-[10px]">{log.source}</span>
                  <span className="text-slate-200">{log.message}</span>
                </div>
                <span className="text-red-400 font-bold text-[10px] shrink-0">
                  +{Math.round(log.intensity * 20)}% DENSITY
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
