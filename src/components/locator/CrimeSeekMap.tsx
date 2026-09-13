import React, { useState, useRef, useMemo } from 'react';
import { 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Crosshair, 
  ShieldAlert, 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  Eye, 
  Layers, 
  Radio, 
  Flame, 
  Send,
  Building,
  Home,
  CheckCircle2,
  Maximize2,
  Mic
} from 'lucide-react';
import { SubjectIdentity, CrimeIncident, TrackWaypoint } from '../../types';
import { latLngToCanvasXY, calculateDistanceKm, formatCoordinates } from '../../utils/geoUtils';
import { HazardHeatmapSvgLayer } from './HazardHeatmapSvgLayer';

interface CrimeSeekMapProps {
  subjects: SubjectIdentity[];
  crimes: CrimeIncident[];
  selectedSubject: SubjectIdentity | null;
  onSelectSubject: (subject: SubjectIdentity) => void;
  selectedCrime: CrimeIncident | null;
  onSelectCrime: (crime: CrimeIncident | null) => void;
  onOpenSendAlert: (subject?: SubjectIdentity, crime?: CrimeIncident) => void;
  seekRadiusKm: number;
  onChangeSeekRadius: (radius: number) => void;
  onOpenVoiceDispatch?: () => void;
  onOpenHazardHeatmap?: () => void;
}

export function CrimeSeekMap({
  subjects,
  crimes,
  selectedSubject,
  onSelectSubject,
  selectedCrime,
  onSelectCrime,
  onOpenSendAlert,
  seekRadiusKm,
  onChangeSeekRadius,
  onOpenVoiceDispatch,
  onOpenHazardHeatmap
}: CrimeSeekMapProps) {
  // Map pan & zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoverCoord, setHoverCoord] = useState<[number, number] | null>(null);

  // Layer visibility
  const [showCrimes, setShowCrimes] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showTracks, setShowTracks] = useState(true);
  const [showVillages, setShowVillages] = useState(true);
  const [showRadarSweep, setShowRadarSweep] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate coordinates on canvas for all subjects and crimes
  const subjectPositions = useMemo(() => {
    return subjects.map((subj) => {
      const coords = subj.coordinates || [52.7408, 6.0792];
      const pos = latLngToCanvasXY(coords[0], coords[1]);
      return { subject: subj, x: pos.x, y: pos.y, coords };
    });
  }, [subjects]);

  const crimePositions = useMemo(() => {
    return crimes.map((crime) => {
      const pos = latLngToCanvasXY(crime.coordinates[0], crime.coordinates[1]);
      return { crime, x: pos.x, y: pos.y };
    });
  }, [crimes]);

  // Crimes inside seek radius of selected subject
  const crimesInSeekRadius = useMemo(() => {
    if (!selectedSubject?.coordinates) return [];
    return crimes.filter((c) => {
      const dist = calculateDistanceKm(selectedSubject.coordinates!, c.coordinates);
      return dist <= seekRadiusKm;
    });
  }, [selectedSubject, crimes, seekRadiusKm]);

  // Active track waypoints for selected subject
  const selectedTrackPoints = useMemo(() => {
    if (!selectedSubject || !selectedSubject.trackWaypoints) return [];
    return selectedSubject.trackWaypoints.map((wp) => {
      const pos = latLngToCanvasXY(wp.coordinates[0], wp.coordinates[1]);
      return { waypoint: wp, x: pos.x, y: pos.y };
    });
  }, [selectedSubject]);

  // Center on selected subject
  const handleCenterOnSubject = (subj: SubjectIdentity) => {
    if (!subj.coordinates) return;
    const pos = latLngToCanvasXY(subj.coordinates[0], subj.coordinates[1]);
    // Centering in a 1000x500 viewport
    const targetZoom = 2.5;
    setZoom(targetZoom);
    setPan({
      x: 500 - pos.x * targetZoom,
      y: 250 - pos.y * targetZoom
    });
    onSelectSubject(subj);
  };

  // Reset view
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse drag handlers for smooth map pan
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

    // Calculate Lat/Long under cursor
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Invert pan and zoom
      const canvasX = (mouseX - pan.x) / zoom;
      const canvasY = (mouseY - pan.y) / zoom;

      const lng = (canvasX / 1000) * 360 - 180;
      const lat = 90 - (canvasY / 500) * 180;

      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setHoverCoord([lat, lng]);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.2 : 0.83;
    const newZoom = Math.min(6, Math.max(0.8, zoom * zoomFactor));
    setZoom(newZoom);
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col relative">
      {/* Tactical Header & Toolbar */}
      <div className="bg-[#1E293B]/90 backdrop-blur border-b border-slate-800 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wider uppercase font-mono">
                TACTICAL CRIME & SUBJECT SEEKMAP
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1">
                <Flame className="w-3 h-3 animate-bounce" />
                {crimes.length} HOTSPOTS ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Global Geolocation • Track & Trace Waypoints • Village & City Outposts
            </p>
          </div>
        </div>

        {/* Seek Radius & Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Seek Radius Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-mono">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Seek Radius:</span>
            <select
              value={seekRadiusKm}
              onChange={(e) => onChangeSeekRadius(Number(e.target.value))}
              className="bg-transparent text-cyan-300 font-bold outline-none cursor-pointer"
            >
              <option value={50} className="bg-slate-900 text-slate-200">50 km (Local Village/City)</option>
              <option value={250} className="bg-slate-900 text-slate-200">250 km (Regional Border)</option>
              <option value={1000} className="bg-slate-900 text-slate-200">1,000 km (Continental)</option>
              <option value={5000} className="bg-slate-900 text-slate-200">5,000 km (Inter-Continental)</option>
            </select>
          </div>

          {/* Layer toggles */}
          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-700 p-1 rounded-lg">
            <button
              onClick={() => setShowCrimes(!showCrimes)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition cursor-pointer flex items-center gap-1 ${
                showCrimes ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Crime Hotspot Markers"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Crimes</span>
            </button>

            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition cursor-pointer flex items-center gap-1 ${
                showHeatmap ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle D3 Real-Time Hazard Heatmap Overlay"
            >
              <Flame className="w-3 h-3 text-orange-400" />
              <span>Heatmap</span>
            </button>

            <button
              onClick={() => setShowTracks(!showTracks)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition cursor-pointer flex items-center gap-1 ${
                showTracks ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Subject Track Waypoints"
            >
              <Navigation className="w-3 h-3" />
              <span>Trails</span>
            </button>

            <button
              onClick={() => setShowVillages(!showVillages)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition cursor-pointer flex items-center gap-1 ${
                showVillages ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Village Outposts"
            >
              <Home className="w-3 h-3" />
              <span>Villages</span>
            </button>
          </div>

          {/* Voice Dispatch quick button */}
          {onOpenVoiceDispatch && (
            <button
              onClick={onOpenVoiceDispatch}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Activate Voice-Guided Dispatch"
            >
              <Mic className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span className="hidden sm:inline">Voice Dispatch</span>
            </button>
          )}

          {/* D3 Hazard Heatmap Full Analytics quick button */}
          {onOpenHazardHeatmap && (
            <button
              onClick={onOpenHazardHeatmap}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Open D3 Hazard Heatmap Analytics Dashboard"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Heatmap Analytics</span>
            </button>
          )}

          {/* Map Controls */}
          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-700 p-1 rounded-lg">
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

      {/* Main SVG Interactive Map Container */}
      <div 
        ref={containerRef}
        className="w-full h-[460px] sm:h-[540px] bg-[#0A0F1D] relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Animated Scan Beam */}
        {showRadarSweep && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
          </div>
        )}

        <svg 
          viewBox="0 0 1000 500" 
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
        >
          {/* Tactical Grid Background */}
          <defs>
            <pattern id="tacticalGrid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1E293B" strokeWidth="0.8" strokeDasharray="2,4" />
            </pattern>
            <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" />
              <stop offset="70%" stopColor="#06B6D4" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
            </radialGradient>
            <filter id="crimsonGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Tactical Background Grid */}
          <rect width="1000" height="500" fill="#090E1A" />
          <rect width="1000" height="500" fill="url(#tacticalGrid)" />

          {/* Equator & Meridian Guidelines */}
          <line x1="0" y1="250" x2="1000" y2="250" stroke="#334155" strokeWidth="0.8" strokeDasharray="4,6" opacity="0.5" />
          <line x1="500" y1="0" x2="500" y2="500" stroke="#334155" strokeWidth="0.8" strokeDasharray="4,6" opacity="0.5" />

          {/* World Continents Vector Outlines (Stylized Low-Poly Tactical World Map) */}
          <g fill="#162238" stroke="#1E3A5F" strokeWidth="1" opacity="0.75">
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

          {/* D3 Real-Time Hazard Heatmap Overlay */}
          {showHeatmap && (
            <HazardHeatmapSvgLayer
              crimes={crimes}
              opacity={0.65}
              bandwidth={35}
              thresholds={11}
              weightMode="severity"
              palette="crimsonHazard"
              showContours={true}
              showClusters={false}
            />
          )}

          {/* Selected Subject's Seek Radius Perimeter */}
          {selectedSubject?.coordinates && (
            <g>
              {(() => {
                const center = latLngToCanvasXY(selectedSubject.coordinates[0], selectedSubject.coordinates[1]);
                // Convert km to approximate canvas pixels (at 1000px = ~40,000 km)
                const radiusPixels = Math.max(16, (seekRadiusKm / 40000) * 1000);
                return (
                  <>
                    <circle
                      cx={center.x}
                      cy={center.y}
                      r={radiusPixels}
                      fill="url(#radarGlow)"
                      stroke="#06B6D4"
                      strokeWidth="1.2"
                      strokeDasharray="4,4"
                      className="animate-pulse"
                    />
                    <circle
                      cx={center.x}
                      cy={center.y}
                      r={radiusPixels}
                      fill="none"
                      stroke="#22D3EE"
                      strokeWidth="0.5"
                      opacity="0.4"
                    />
                  </>
                );
              })()}
            </g>
          )}

          {/* Historical Movement Polyline connecting waypoints */}
          {showTracks && selectedTrackPoints.length > 1 && (
            <g>
              {/* Glowing Background Route */}
              <polyline
                points={selectedTrackPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#06B6D4"
                strokeWidth="2.5"
                strokeDasharray="6,6"
                opacity="0.8"
                filter="url(#crimsonGlow)"
              />
              {/* Waypoint Connection Lines */}
              <polyline
                points={selectedTrackPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="1"
                opacity="0.6"
              />

              {/* Waypoint Number Markers */}
              {selectedTrackPoints.map((pt, idx) => (
                <g key={pt.waypoint.id} transform={`translate(${pt.x}, ${pt.y})`}>
                  <circle
                    r="6"
                    fill={pt.waypoint.statusFlag === 'FRAUD_FLAGGED' ? '#EF4444' : '#0EA5E9'}
                    stroke="#0F172A"
                    strokeWidth="1.5"
                  />
                  <text
                    y="3"
                    textAnchor="middle"
                    fontSize="7"
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill="#FFFFFF"
                  >
                    {idx + 1}
                  </text>
                  {/* Waypoint Label */}
                  <text
                    x="9"
                    y="3"
                    fontSize="8"
                    fontFamily="monospace"
                    fill="#94A3B8"
                    opacity="0.9"
                  >
                    {pt.waypoint.cityOrVillage}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* Crime Incident Markers */}
          {showCrimes &&
            crimePositions.map(({ crime, x, y }) => {
              const isSelected = selectedCrime?.id === crime.id;
              const isInsideSeek = crimesInSeekRadius.some((c) => c.id === crime.id);

              return (
                <g 
                  key={crime.id} 
                  transform={`translate(${x}, ${y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCrime(isSelected ? null : crime);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Pulse Ring for Critical Incidents */}
                  {crime.severity === 'CRITICAL' && (
                    <circle
                      r="14"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="1.5"
                      opacity="0.7"
                      className="animate-ping"
                    />
                  )}

                  {/* Highlight ring if inside current subject's seek radius */}
                  {isInsideSeek && (
                    <circle
                      r="12"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="1.8"
                      strokeDasharray="2,2"
                      className="animate-spin"
                      style={{ animationDuration: '6s' }}
                    />
                  )}

                  {/* Center Crime Icon Node */}
                  <circle
                    r={isSelected ? '9' : '7'}
                    fill={crime.severity === 'CRITICAL' ? '#DC2626' : '#D97706'}
                    stroke={isSelected ? '#FFFFFF' : '#7F1D1D'}
                    strokeWidth="2"
                    filter="url(#crimsonGlow)"
                  />

                  {/* Crime Cross Symbol */}
                  <path
                    d="M -3 -3 L 3 3 M 3 -3 L -3 3"
                    stroke="#FFFFFF"
                    strokeWidth="1.2"
                  />

                  {/* Label */}
                  <text
                    x="10"
                    y="-4"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill={crime.severity === 'CRITICAL' ? '#FCA5A5' : '#FDE68A'}
                    className="select-none"
                  >
                    {crime.caseNumber}
                  </text>
                  <text
                    x="10"
                    y="7"
                    fontSize="7"
                    fontFamily="sans-serif"
                    fill="#94A3B8"
                    className="select-none"
                  >
                    {crime.cityOrVillage} ({crime.isVillage ? 'Village' : 'City'})
                  </text>
                </g>
              );
            })}

          {/* Tracked Subject Markers */}
          {subjectPositions.map(({ subject, x, y }) => {
            const isSelected = selectedSubject?.id === subject.id;
            const isRedNotice = subject.isRedNotice;

            return (
              <g
                key={subject.id}
                transform={`translate(${x}, ${y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSubject(subject);
                }}
                className="cursor-pointer group"
              >
                {/* Radar target lock ring */}
                <circle
                  r={isSelected ? '18' : '14'}
                  fill="none"
                  stroke={isRedNotice ? '#EF4444' : '#06B6D4'}
                  strokeWidth={isSelected ? '2' : '1'}
                  strokeDasharray="4,3"
                  className={isSelected ? 'animate-spin' : ''}
                  style={{ animationDuration: '10s' }}
                />

                {/* Center Badge */}
                <circle
                  r={isSelected ? '10' : '8'}
                  fill={isRedNotice ? '#7F1D1D' : '#0E7490'}
                  stroke={isSelected ? '#FFFFFF' : isRedNotice ? '#EF4444' : '#22D3EE'}
                  strokeWidth="2"
                />

                {/* Initial Letter */}
                <text
                  textAnchor="middle"
                  y="3.5"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill="#FFFFFF"
                >
                  {subject.fullName.charAt(0)}
                </text>

                {/* Subject Name Tag */}
                <text
                  x="14"
                  y="-2"
                  fontSize="10"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                  fill={isSelected ? '#38BDF8' : '#F8FAFC'}
                  className="select-none"
                >
                  {subject.fullName}
                </text>
                <text
                  x="14"
                  y="10"
                  fontSize="8"
                  fontFamily="monospace"
                  fill="#94A3B8"
                  className="select-none"
                >
                  {subject.idNumber} • {subject.cityOrVillage} {subject.isVillage ? '🏡' : '🏢'}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Realtime Coordinate & Telemetry HUD Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 flex items-center gap-3 shadow-lg pointer-events-none">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Crosshair className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
            <span>GEO-RADAR:</span>
          </div>
          <span>
            {hoverCoord ? formatCoordinates(hoverCoord) : '52.7408° N, 6.0792° E'}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400">
            ZOOM: {zoom.toFixed(1)}x
          </span>
          {crimesInSeekRadius.length > 0 && (
            <>
              <span className="text-slate-500">|</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {crimesInSeekRadius.length} in Seek Radius
              </span>
            </>
          )}
        </div>

        {/* Selected Subject Quick-Target Bar */}
        {selectedSubject && (
          <div className="absolute top-3 left-3 bg-slate-900/95 backdrop-blur border border-cyan-500/40 px-3.5 py-2 rounded-xl text-xs shadow-xl flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white tracking-wide">{selectedSubject.fullName}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {selectedSubject.idNumber}
                </span>
                {selectedSubject.isVillage && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    VILLAGE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {selectedSubject.cityOrVillage}, {selectedSubject.country} • Fraud Risk: {selectedSubject.fraudRiskScore}%
              </p>
            </div>
            <button
              onClick={() => handleCenterOnSubject(selectedSubject)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition cursor-pointer"
              title="Center & Zoom on Subject"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onOpenSendAlert(selectedSubject)}
              className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-sm"
              title="Dispatch Alert to Interpol / Police"
            >
              <Send className="w-3 h-3" />
              <span>Send Alert</span>
            </button>
          </div>
        )}
      </div>

      {/* Selected Crime Modal / Bottom Forensics Card */}
      {selectedCrime && (
        <div className="bg-[#1E293B] border-t border-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-lg border shrink-0 ${
              selectedCrime.severity === 'CRITICAL'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-white">{selectedCrime.title}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedCrime.caseNumber}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                  selectedCrime.severity === 'CRITICAL'
                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {selectedCrime.severity}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {selectedCrime.cityOrVillage} ({selectedCrime.country}) {selectedCrime.isVillage ? '🏡 Village' : '🏢 City'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                {selectedCrime.description}
              </p>
              {selectedCrime.estimatedDamagesUsd && (
                <div className="mt-1 text-[11px] font-mono text-slate-400 flex items-center gap-3">
                  <span>Est. Damages: <strong className="text-emerald-400">${(selectedCrime.estimatedDamagesUsd / 1e6).toFixed(1)}M USD</strong></span>
                  <span>•</span>
                  <span>Coordinates: {formatCoordinates(selectedCrime.coordinates)}</span>
                  <span>•</span>
                  <span>Evidence: {selectedCrime.evidenceDigest}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenSendAlert(selectedSubject || undefined, selectedCrime)}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Crime Alert</span>
            </button>
            <button
              onClick={() => onSelectCrime(null)}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
