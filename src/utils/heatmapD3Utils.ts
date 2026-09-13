import * as d3 from 'd3';
import { CrimeIncident, ThreatSeverity, CrimeCategory } from '../types';
import { latLngToCanvasXY, calculateDistanceKm, formatCoordinates } from './geoUtils';

export type HeatmapPalette = 'inferno' | 'turbo' | 'plasma' | 'crimsonHazard';
export type HeatmapWeightMode = 'severity' | 'flat' | 'damages';

export interface HazardHeatmapPoint {
  x: number;
  y: number;
  lat: number;
  lng: number;
  weight: number;
  crime?: CrimeIncident;
  isLivePing?: boolean;
  sourceLabel?: string;
}

export interface LiveSensorPing {
  id: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  label: string;
  intensity: number;
  timestamp: number;
  source: string;
}

export interface HazardCluster {
  id: string;
  codename: string;
  shortName: string;
  centroidLat: number;
  centroidLng: number;
  centroidX: number;
  centroidY: number;
  radiusKm: number;
  incidents: CrimeIncident[];
  incidentCount: number;
  criticalCount: number;
  highCount: number;
  totalDamagesUsd: number;
  dominantCategory: CrimeCategory;
  threatScore: number; // 0 - 100
  threatLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MODERATE';
  geographicRegion: string;
}

export interface ContourRenderItem {
  id: string;
  pathString: string;
  value: number;
  normalizedValue: number; // 0 to 1
  fillColor: string;
  strokeColor: string;
  opacity: number;
}

/**
 * Calculates weights for crime incidents based on user-selected metric mode
 */
export function getCrimePointWeight(crime: CrimeIncident, mode: HeatmapWeightMode): number {
  if (mode === 'flat') {
    return 1;
  }
  if (mode === 'damages') {
    const damages = crime.estimatedDamagesUsd || 100000;
    // Logarithmic scale so billion-dollar cases don't completely obliterate others
    return Math.max(1, Math.min(8, Math.log10(damages) - 4.5));
  }
  // Default: severity
  switch (crime.severity) {
    case 'CRITICAL':
      return 4.5;
    case 'HIGH':
      return 2.8;
    case 'MEDIUM':
      return 1.6;
    case 'LOW':
    default:
      return 1.0;
  }
}

/**
 * Transform crimes and dynamic live pings into 2D canvas points with coordinates
 */
export function prepareHeatmapPoints(
  crimes: CrimeIncident[],
  weightMode: HeatmapWeightMode = 'severity',
  livePings: LiveSensorPing[] = [],
  width = 1000,
  height = 500
): HazardHeatmapPoint[] {
  const points: HazardHeatmapPoint[] = [];

  for (const crime of crimes) {
    const [lat, lng] = crime.coordinates;
    const pos = latLngToCanvasXY(lat, lng, width, height);
    const weight = getCrimePointWeight(crime, weightMode);

    points.push({
      x: pos.x,
      y: pos.y,
      lat,
      lng,
      weight,
      crime,
      isLivePing: false,
      sourceLabel: `${crime.caseNumber} - ${crime.cityOrVillage}`
    });
  }

  // Include dynamic real-time sensor pings if present
  for (const ping of livePings) {
    points.push({
      x: ping.x,
      y: ping.y,
      lat: ping.lat,
      lng: ping.lng,
      weight: ping.intensity * 3.5,
      isLivePing: true,
      sourceLabel: `[LIVE SENSOR] ${ping.source}: ${ping.label}`
    });
  }

  return points;
}

/**
 * Custom color interpolator for tactical military/cyber defense hazard gradient
 */
export function interpolateTacticalHazard(t: number): string {
  // t is between 0 and 1
  if (t <= 0.15) {
    // Very low: Cyan / Blue translucency
    return d3.interpolateRgb('rgba(6, 182, 212, 0.25)', 'rgba(14, 165, 233, 0.45)')(t / 0.15);
  } else if (t <= 0.4) {
    // Low to Moderate: Electric Blue to Lime-Amber
    return d3.interpolateRgb('rgba(14, 165, 233, 0.45)', 'rgba(234, 179, 8, 0.65)')((t - 0.15) / 0.25);
  } else if (t <= 0.7) {
    // Moderate to High: Bright Amber to Fiery Orange
    return d3.interpolateRgb('rgba(234, 179, 8, 0.65)', 'rgba(249, 115, 22, 0.8)')((t - 0.4) / 0.3);
  } else if (t <= 0.9) {
    // High to Critical: Vivid Orange to Crimson Hazard Red
    return d3.interpolateRgb('rgba(249, 115, 22, 0.8)', 'rgba(239, 68, 68, 0.92)')((t - 0.7) / 0.2);
  } else {
    // Supercritical Epicenter: Crimson Red to White-Hot Solar Core
    return d3.interpolateRgb('rgba(239, 68, 68, 0.92)', 'rgba(255, 241, 242, 0.98)')((t - 0.9) / 0.1);
  }
}

/**
 * Returns color string for a normalized density value [0, 1]
 */
export function getHazardColor(normalizedValue: number, palette: HeatmapPalette): string {
  const clamped = Math.max(0, Math.min(1, normalizedValue));
  switch (palette) {
    case 'inferno':
      return d3.interpolateInferno(clamped);
    case 'turbo':
      return d3.interpolateTurbo(clamped);
    case 'plasma':
      return d3.interpolatePlasma(clamped);
    case 'crimsonHazard':
    default:
      return interpolateTacticalHazard(clamped);
  }
}

/**
 * Computes 2D contour density shapes using D3.contourDensity and D3.geoPath
 */
export function generateHazardContours(
  points: HazardHeatmapPoint[],
  bandwidth = 35,
  thresholdCount = 12,
  palette: HeatmapPalette = 'crimsonHazard',
  baseOpacity = 0.65,
  width = 1000,
  height = 500
): ContourRenderItem[] {
  if (!points || points.length === 0) return [];

  try {
    // Build D3 contour density generator
    const densityGenerator = d3.contourDensity<HazardHeatmapPoint>()
      .x((d) => d.x)
      .y((d) => d.y)
      .weight((d) => d.weight)
      .size([width, height])
      .bandwidth(bandwidth)
      .thresholds(thresholdCount);

    const contours = densityGenerator(points);
    if (!contours || contours.length === 0) return [];

    const pathGenerator = d3.geoPath();
    const values = contours.map((c) => c.value);
    const minVal = d3.min(values) || 0;
    const maxVal = d3.max(values) || 1;
    const valueRange = maxVal > minVal ? maxVal - minVal : 1;

    const results: ContourRenderItem[] = [];

    contours.forEach((contour, idx) => {
      const pathString = pathGenerator(contour);
      if (!pathString) return;

      const normalized = (contour.value - minVal) / valueRange;
      const fillColor = getHazardColor(normalized, palette);
      // Higher density contours become progressively more prominent
      const contourOpacity = Math.min(0.95, baseOpacity * (0.35 + normalized * 0.65));

      results.push({
        id: `contour-${idx}-${contour.value.toFixed(6)}`,
        pathString,
        value: contour.value,
        normalizedValue: normalized,
        fillColor,
        strokeColor: d3.color(fillColor)?.brighter(0.4).formatHex() || fillColor,
        opacity: contourOpacity
      });
    });

    return results;
  } catch (err) {
    console.error('Error generating D3 contour density heatmap:', err);
    return [];
  }
}

/**
 * Automated spatial clustering to identify geographic crime density clusters
 */
export function detectHazardClusters(
  crimes: CrimeIncident[],
  maxClusterRadiusKm = 1000
): HazardCluster[] {
  if (crimes.length === 0) return [];

  const unassigned = [...crimes];
  const clusters: CrimeIncident[][] = [];

  while (unassigned.length > 0) {
    const seed = unassigned.shift()!;
    const cluster = [seed];

    for (let i = unassigned.length - 1; i >= 0; i--) {
      const candidate = unassigned[i];
      const dist = calculateDistanceKm(seed.coordinates, candidate.coordinates);
      if (dist <= maxClusterRadiusKm) {
        cluster.push(candidate);
        unassigned.splice(i, 1);
      }
    }
    clusters.push(cluster);
  }

  // Tactical NATO / Law Enforcement designations
  const PHONETIC_NAMES = [
    { code: 'ALPHA', name: 'Cluster Alpha: North Sea & Benelux Nexus', region: 'Western Europe' },
    { code: 'BRAVO', name: 'Cluster Bravo: Andean Cyber-Escrow Hub', region: 'South America' },
    { code: 'CHARLIE', name: 'Cluster Charlie: Alpine Transit Corridor', region: 'Central Europe' },
    { code: 'DELTA', name: 'Cluster Delta: Swahili Maritime Gate', region: 'East Africa' },
    { code: 'ECHO', name: 'Cluster Echo: Mid-Atlantic Defense Axis', region: 'North America' },
    { code: 'FOXTROT', name: 'Cluster Foxtrot: Tokyo Pacific ATM Corridor', region: 'East Asia' },
    { code: 'GOLF', name: 'Cluster Golf: Iberian Mesh Outpost', region: 'Southern Europe' }
  ];

  return clusters
    .map((incidents, idx) => {
      const phonetic = PHONETIC_NAMES[idx] || {
        code: `ZONE-${idx + 1}`,
        name: `Cluster Zone-${idx + 1}`,
        region: incidents[0]?.country || 'International'
      };

      // Calculate centroid coordinates
      const avgLat = incidents.reduce((acc, c) => acc + c.coordinates[0], 0) / incidents.length;
      const avgLng = incidents.reduce((acc, c) => acc + c.coordinates[1], 0) / incidents.length;
      const canvasPos = latLngToCanvasXY(avgLat, avgLng);

      // Max radius of incidents from centroid
      const radiusKm = Math.max(
        50,
        ...incidents.map((c) => calculateDistanceKm([avgLat, avgLng], c.coordinates))
      );

      const criticalCount = incidents.filter((c) => c.severity === 'CRITICAL').length;
      const highCount = incidents.filter((c) => c.severity === 'HIGH').length;
      const totalDamagesUsd = incidents.reduce((acc, c) => acc + (c.estimatedDamagesUsd || 0), 0);

      // Category counts
      const catCount: Record<string, number> = {};
      incidents.forEach((c) => {
        catCount[c.category] = (catCount[c.category] || 0) + 1;
      });
      const dominantCategory = Object.keys(catCount).sort(
        (a, b) => catCount[b] - catCount[a]
      )[0] as CrimeCategory;

      // Compute threat score (0 - 100)
      let score = criticalCount * 30 + highCount * 18 + incidents.length * 8;
      if (totalDamagesUsd > 10000000) score += 20;
      else if (totalDamagesUsd > 5000000) score += 12;
      const threatScore = Math.min(100, Math.max(15, score));

      let threatLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MODERATE' = 'MODERATE';
      if (threatScore >= 75 || criticalCount >= 2) threatLevel = 'CRITICAL';
      else if (threatScore >= 50 || criticalCount === 1) threatLevel = 'HIGH';
      else if (threatScore >= 30) threatLevel = 'ELEVATED';

      return {
        id: `CLUSTER-${idx + 1}`,
        codename: phonetic.name,
        shortName: phonetic.code,
        centroidLat: Math.round(avgLat * 10000) / 10000,
        centroidLng: Math.round(avgLng * 10000) / 10000,
        centroidX: canvasPos.x,
        centroidY: canvasPos.y,
        radiusKm,
        incidents,
        incidentCount: incidents.length,
        criticalCount,
        highCount,
        totalDamagesUsd,
        dominantCategory,
        threatScore,
        threatLevel,
        geographicRegion: phonetic.region
      };
    })
    .sort((a, b) => b.threatScore - a.threatScore);
}

/**
 * Pre-defined real-time simulated hazard surveillance pings for live telemetry stream
 */
export const SAMPLE_LIVE_SENSOR_PINGS: Omit<LiveSensorPing, 'id' | 'timestamp'>[] = [
  {
    lat: 52.75,
    lng: 6.12,
    x: latLngToCanvasXY(52.75, 6.12).x,
    y: latLngToCanvasXY(52.75, 6.12).y,
    label: 'Giethoorn canal unflagged radio packet spike',
    intensity: 1.0,
    source: 'SIENA-SIGINT #04'
  },
  {
    lat: 6.25,
    lng: -75.56,
    x: latLngToCanvasXY(6.25, -75.56).x,
    y: latLngToCanvasXY(6.25, -75.56).y,
    label: 'Medellín server rack high-volume exfiltration burst',
    intensity: 1.2,
    source: 'INTERPOL-CYBER #11'
  },
  {
    lat: 45.98,
    lng: 7.76,
    x: latLngToCanvasXY(45.98, 7.76).x,
    y: latLngToCanvasXY(45.98, 7.76).y,
    label: 'Zermatt alpine electromagnetic glitch trigger',
    intensity: 0.85,
    source: 'FEDPOL-BORDER #09'
  },
  {
    lat: 51.93,
    lng: 4.49,
    x: latLngToCanvasXY(51.93, 4.49).x,
    y: latLngToCanvasXY(51.93, 4.49).y,
    label: 'Rotterdam smart seal tamper event alert',
    intensity: 1.1,
    source: 'EUROPOL-SEAL #02'
  },
  {
    lat: -2.28,
    lng: 40.91,
    x: latLngToCanvasXY(-2.28, 40.91).x,
    y: latLngToCanvasXY(-2.28, 40.91).y,
    label: 'Lamu shallow channel high-gain transceiver uplink',
    intensity: 0.9,
    source: 'AFRICOM-RADAR #08'
  },
  {
    lat: 38.81,
    lng: -77.05,
    x: latLngToCanvasXY(38.81, -77.05).x,
    y: latLngToCanvasXY(38.81, -77.05).y,
    label: 'Alexandria perimeter RF sensor anomalous handoff',
    intensity: 0.95,
    source: 'NCIS-TELEMETRY #05'
  }
];
