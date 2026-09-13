import React, { useMemo } from 'react';
import { CrimeIncident } from '../../types';
import {
  HazardHeatmapPoint,
  LiveSensorPing,
  HazardCluster,
  HeatmapPalette,
  HeatmapWeightMode,
  prepareHeatmapPoints,
  generateHazardContours,
  detectHazardClusters
} from '../../utils/heatmapD3Utils';

interface HazardHeatmapSvgLayerProps {
  crimes: CrimeIncident[];
  livePings?: LiveSensorPing[];
  bandwidth?: number;
  thresholds?: number;
  weightMode?: HeatmapWeightMode;
  palette?: HeatmapPalette;
  opacity?: number;
  showContours?: boolean;
  showClusters?: boolean;
  selectedClusterId?: string | null;
  onSelectCluster?: (cluster: HazardCluster) => void;
  width?: number;
  height?: number;
}

export const HazardHeatmapSvgLayer: React.FC<HazardHeatmapSvgLayerProps> = ({
  crimes,
  livePings = [],
  bandwidth = 35,
  thresholds = 12,
  weightMode = 'severity' as HeatmapWeightMode,
  palette = 'crimsonHazard' as HeatmapPalette,
  opacity = 0.65,
  showContours = true,
  showClusters = true,
  selectedClusterId,
  onSelectCluster,
  width = 1000,
  height = 500
}: HazardHeatmapSvgLayerProps) => {
  // 1. Prepare points with weighting
  const points = useMemo(() => {
    return prepareHeatmapPoints(crimes, weightMode, livePings, width, height);
  }, [crimes, weightMode, livePings, width, height]);

  // 2. Generate D3 contour density paths
  const contours = useMemo(() => {
    if (!showContours || points.length === 0) return [];
    return generateHazardContours(
      points,
      bandwidth,
      thresholds,
      palette,
      opacity,
      width,
      height
    );
  }, [points, bandwidth, thresholds, palette, opacity, showContours, width, height]);

  // 3. Detect density clusters
  const clusters = useMemo(() => {
    return detectHazardClusters(crimes);
  }, [crimes]);

  return (
    <g id="d3-hazard-heatmap-overlay" className="pointer-events-auto">
      {/* SVG Defs for thermal glow and blur effects */}
      <defs>
        <filter id="hazardSoftBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="epicenterRadarGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur2" />
          <feMerge>
            <feMergeNode in="blur1" />
            <feMergeNode in="blur2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* D3 Computed Density Iso-Contours */}
      {showContours && (
        <g id="heatmap-contours-group" filter="url(#hazardSoftBlur)">
          {contours.map((item) => (
            <path
              key={item.id}
              d={item.pathString}
              fill={item.fillColor}
              fillOpacity={item.opacity}
              stroke={item.strokeColor}
              strokeWidth={item.normalizedValue > 0.6 ? '1.2' : '0.6'}
              strokeOpacity={item.opacity * 0.9}
              className="transition-all duration-300 ease-out"
            />
          ))}
        </g>
      )}

      {/* Real-Time Live Sensor Pings (pulsating heat spikes) */}
      {livePings.map((ping) => (
        <g key={ping.id} transform={`translate(${ping.x}, ${ping.y})`} className="pointer-events-none">
          <circle
            r="16"
            fill="none"
            stroke="#EF4444"
            strokeWidth="1.8"
            opacity="0.8"
            className="animate-ping"
          />
          <circle
            r="8"
            fill="#EF4444"
            fillOpacity="0.6"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            filter="url(#epicenterRadarGlow)"
          />
          <circle r="3" fill="#FFFFFF" />
          <text
            x="12"
            y="-8"
            fontSize="8"
            fontFamily="monospace"
            fontWeight="bold"
            fill="#FCA5A5"
            className="select-none drop-shadow"
          >
            LIVE: {ping.source}
          </text>
        </g>
      ))}

      {/* Geographic Hazard Cluster Centroids & Radar Epicenters */}
      {showClusters &&
        clusters.map((cluster) => {
          const isSelected = selectedClusterId === cluster.id;
          const isCritical = cluster.threatLevel === 'CRITICAL';
          const isHigh = cluster.threatLevel === 'HIGH';

          const strokeColor = isCritical ? '#EF4444' : isHigh ? '#F59E0B' : '#06B6D4';
          const fillColor = isCritical ? 'rgba(239, 68, 68, 0.25)' : isHigh ? 'rgba(245, 158, 11, 0.2)' : 'rgba(6, 182, 212, 0.15)';

          return (
            <g
              key={cluster.id}
              id={`cluster-epicenter-${cluster.id}`}
              transform={`translate(${cluster.centroidX}, ${cluster.centroidY})`}
              className="cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                onSelectCluster?.(cluster);
              }}
            >
              {/* Pulsating Cluster Perimeter Ring */}
              <circle
                r={isSelected ? 26 : 20}
                fill="none"
                stroke={strokeColor}
                strokeWidth={isSelected ? '2' : '1.2'}
                strokeDasharray="4,3"
                opacity={isSelected ? '0.9' : '0.6'}
                className={isSelected || isCritical ? 'animate-spin' : ''}
                style={{ animationDuration: '8s' }}
              />

              {/* Ping Ring for Critical Clusters */}
              {isCritical && (
                <circle
                  r="28"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="1"
                  opacity="0.5"
                  className="animate-ping"
                />
              )}

              {/* Central Core Shield Circle */}
              <circle
                r={isSelected ? 11 : 9}
                fill={fillColor}
                stroke={isSelected ? '#FFFFFF' : strokeColor}
                strokeWidth="2"
                filter="url(#epicenterRadarGlow)"
              />

              {/* Threat Score Icon / Text inside Node */}
              <text
                textAnchor="middle"
                y="3"
                fontSize="7"
                fontFamily="monospace"
                fontWeight="extrabold"
                fill="#FFFFFF"
                className="select-none pointer-events-none"
              >
                {cluster.threatScore}
              </text>

              {/* Cluster Codename Pill Header */}
              <g transform="translate(14, -10)" className="pointer-events-none">
                <rect
                  x="-2"
                  y="-10"
                  width={Math.max(70, cluster.shortName.length * 6.5 + 40)}
                  height="18"
                  rx="4"
                  fill="#090E1A"
                  fillOpacity="0.88"
                  stroke={isSelected ? '#38BDF8' : strokeColor}
                  strokeWidth="1"
                />
                <text
                  x="4"
                  y="2"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill={isCritical ? '#FCA5A5' : isHigh ? '#FDE68A' : '#7DD3FC'}
                  className="select-none"
                >
                  {cluster.shortName} • {cluster.incidentCount} CAS
                </text>
              </g>

              {/* Cluster Locality Label */}
              <text
                x="14"
                y="16"
                fontSize="7.5"
                fontFamily="sans-serif"
                fontWeight="500"
                fill="#CBD5E1"
                className="select-none pointer-events-none drop-shadow"
              >
                {cluster.geographicRegion}
              </text>
            </g>
          );
        })}
    </g>
  );
};
