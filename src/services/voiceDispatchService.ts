import {
  SubjectIdentity,
  CrimeIncident,
  DispatchedLawEnforcementAlert,
  AlertAgencyRecipient,
  AlertUrgency
} from '../types';
import { calculateDistanceKm, formatCoordinates } from '../utils/geoUtils';

export interface TacticalInterceptUnit {
  id: string;
  name: string;
  type: 'GROUND_PATROL' | 'RAPID_TACTICAL' | 'AIR_DRONE_WING' | 'MARITIME_INTERCEPT' | 'BORDER_TASKFORCE';
  baseLocation: string;
  baseCoordinates: [number, number];
  averageSpeedKmH: number;
  callSign: string;
}

// Tactical response units situated across key regions
export const TACTICAL_INTERCEPT_UNITS: TacticalInterceptUnit[] = [
  {
    id: 'UNIT-NL-ALPHA',
    name: 'Europol Fast-Response Intercept Team Alpha',
    type: 'RAPID_TACTICAL',
    baseLocation: 'The Hague / Zwolle Forward Post',
    baseCoordinates: [52.5168, 6.083],
    averageSpeedKmH: 120,
    callSign: 'VIPER-01'
  },
  {
    id: 'UNIT-CH-ALPINE',
    name: 'Swiss Cantonal Border Intervention Patrol',
    type: 'GROUND_PATROL',
    baseLocation: 'Sion Alpine Aviation Base',
    baseCoordinates: [46.2333, 7.35],
    averageSpeedKmH: 95,
    callSign: 'CHOUGH-04'
  },
  {
    id: 'UNIT-CO-MEDELLIN',
    name: 'National Police Anti-Extortion Taskforce',
    type: 'RAPID_TACTICAL',
    baseLocation: 'Medellín Central Aviation Command',
    baseCoordinates: [6.2518, -75.5636],
    averageSpeedKmH: 110,
    callSign: 'CONDOR-77'
  },
  {
    id: 'UNIT-US-CAPITAL',
    name: 'Federal Cyber-Incident Intercept Unit',
    type: 'AIR_DRONE_WING',
    baseLocation: 'Quantico Tactical Hangar',
    baseCoordinates: [38.5222, -77.3012],
    averageSpeedKmH: 220,
    callSign: 'TALON-09'
  },
  {
    id: 'UNIT-FR-ALSACE',
    name: 'Gendarmerie Nationale Cyber-Crossborder Unit',
    type: 'GROUND_PATROL',
    baseLocation: 'Colmar Tactical Station',
    baseCoordinates: [48.0794, 7.3582],
    averageSpeedKmH: 115,
    callSign: 'FALCON-03'
  },
  {
    id: 'UNIT-KE-COASTAL',
    name: 'Mombasa Port Maritime Counter-Fraud Detail',
    type: 'MARITIME_INTERCEPT',
    baseLocation: 'Kilindini Naval Base',
    baseCoordinates: [-4.062, 39.654],
    averageSpeedKmH: 80,
    callSign: 'CORSAIR-12'
  },
  {
    id: 'UNIT-JP-KANTO',
    name: 'Tokyo Metropolitan High-Tech Crime Strike Detachment',
    type: 'RAPID_TACTICAL',
    baseLocation: 'Shibuya Regional Precinct',
    baseCoordinates: [35.658, 139.7016],
    averageSpeedKmH: 85,
    callSign: 'KATANA-08'
  },
  {
    id: 'UNIT-GLOBAL-DRONE',
    name: 'Interpol High-Altitude Autonomous Attestation Drone',
    type: 'AIR_DRONE_WING',
    baseLocation: 'Sub-Orbital Orbiting Geostationary Relay',
    baseCoordinates: [50.0, 10.0],
    averageSpeedKmH: 340,
    callSign: 'SENTINEL-99'
  }
];

export interface VoiceDispatchParseResult {
  rawTranscript: string;
  isCoordinateRequest: boolean;
  targetName: string;
  matchedSubject?: SubjectIdentity;
  matchedCrime?: CrimeIncident;
  targetCoordinates: [number, number];
  locationDescription: string;
  isVillage: boolean;
  agencyRecipient: AlertAgencyRecipient;
  urgency: AlertUrgency;
  interceptUnit: TacticalInterceptUnit;
  distanceKm: number;
  estimatedEtaMinutes: number;
  bearingDegrees: number;
  bearingCompass: string;
  corridorStatus: 'SECURE_CLEAR' | 'TRANSIT_ADVISORY' | 'ALPINE_PASS_RESTRICTION' | 'URBAN_RUSH_CLEARANCE';
  routeDescription: string;
  audioConfirmationSpeech: string;
  generatedAlert: DispatchedLawEnforcementAlert;
}

// Calculate bearing in degrees from coord1 to coord2
export function calculateBearingDegrees(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lat1, lon1] = [coord1[0] * (Math.PI / 180), coord1[1] * (Math.PI / 180)];
  const [lat2, lon2] = [coord2[0] * (Math.PI / 180), coord2[1] * (Math.PI / 180)];
  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  const brng = Math.atan2(y, x) * (180 / Math.PI);
  return Math.round((brng + 360) % 360);
}

export function degreesToCompass(deg: number): string {
  const directions = [
    'North',
    'North-Northeast',
    'Northeast',
    'East-Northeast',
    'East',
    'East-Southeast',
    'Southeast',
    'South-Southeast',
    'South',
    'South-Southwest',
    'Southwest',
    'West-Southwest',
    'West',
    'West-Northwest',
    'Northwest',
    'North-Northwest'
  ];
  const idx = Math.round(deg / 22.5) % 16;
  return directions[idx];
}

/**
 * Parses spoken natural language voice command to extract coordinates,
 * resolve target entities, calculate route status, and generate audio confirmation.
 */
export function parseVoiceDispatchRequest(
  transcript: string,
  subjects: SubjectIdentity[],
  crimes: CrimeIncident[]
): VoiceDispatchParseResult {
  const lower = transcript.toLowerCase().trim();

  // 1. Check for explicit coordinate speech e.g. "52.74, 6.08" or "latitude 52.74 longitude 6.08"
  let parsedCoords: [number, number] | null = null;
  const coordRegex = /(-?\d{1,2}\.?\d*)\s*(?:degrees|deg|°)?\s*(?:,|and|\s)\s*(-?\d{1,3}\.?\d*)/i;
  const matchNum = lower.match(coordRegex);

  if (matchNum && !isNaN(parseFloat(matchNum[1])) && !isNaN(parseFloat(matchNum[2]))) {
    const lat = parseFloat(matchNum[1]);
    const lng = parseFloat(matchNum[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      parsedCoords = [lat, lng];
    }
  }

  // 2. Identify target subject by name, alias, or ID
  let matchedSubject: SubjectIdentity | undefined = undefined;
  for (const subj of subjects) {
    const nameTokens = subj.fullName.toLowerCase().split(' ');
    const hasNameMatch = nameTokens.some((tok) => tok.length > 2 && lower.includes(tok));
    const hasAliasMatch = subj.aliases.some((al) => lower.includes(al.toLowerCase()));
    const hasIdMatch = lower.includes(subj.id.toLowerCase()) || lower.includes(subj.idNumber.toLowerCase());
    const hasCityMatch = lower.includes(subj.cityOrVillage.toLowerCase());

    if (hasNameMatch || hasAliasMatch || hasIdMatch || (hasCityMatch && !matchedSubject)) {
      matchedSubject = subj;
      break;
    }
  }

  // 3. Identify target crime incident by case number, title, or location
  let matchedCrime: CrimeIncident | undefined = undefined;
  for (const crime of crimes) {
    const caseNum = crime.caseNumber.toLowerCase();
    const city = crime.cityOrVillage.toLowerCase();
    const titleTokens = crime.title.toLowerCase().split(' ');

    if (
      lower.includes(caseNum) ||
      lower.includes(crime.id.toLowerCase()) ||
      lower.includes(city) ||
      titleTokens.some((t) => t.length > 5 && lower.includes(t))
    ) {
      matchedCrime = crime;
      break;
    }
  }

  // 4. Resolve Target Coordinates
  let targetCoords: [number, number] = [52.7408, 6.0792]; // Default Giethoorn coordinates
  let targetName = 'Target Sector';
  let locationDesc = 'Giethoorn Village, Netherlands';
  let isVillage = true;

  if (parsedCoords) {
    targetCoords = parsedCoords;
    targetName = `Coordinates ${formatCoordinates(targetCoords)}`;
    locationDesc = `Field Geodetic Coordinates ${formatCoordinates(targetCoords)}`;
  } else if (matchedSubject && matchedSubject.coordinates) {
    targetCoords = matchedSubject.coordinates;
    targetName = matchedSubject.fullName;
    locationDesc = `${matchedSubject.cityOrVillage} (${matchedSubject.isVillage ? 'Rural Village' : 'City'}), ${matchedSubject.country}`;
    isVillage = matchedSubject.isVillage;
  } else if (matchedCrime) {
    targetCoords = matchedCrime.coordinates;
    targetName = `${matchedCrime.caseNumber} - ${matchedCrime.title}`;
    locationDesc = `${matchedCrime.cityOrVillage} (${matchedCrime.isVillage ? 'Rural Village' : 'City'}), ${matchedCrime.country}`;
    isVillage = matchedCrime.isVillage;
  } else {
    // Check known locality keywords
    if (lower.includes('giethoorn')) {
      targetCoords = [52.7408, 6.0792];
      targetName = 'Giethoorn Village Sector';
      locationDesc = 'Giethoorn Village, Overijssel, Netherlands';
      isVillage = true;
    } else if (lower.includes('medellin') || lower.includes('medellín')) {
      targetCoords = [6.2442, -75.5812];
      targetName = 'Medellín Operational District';
      locationDesc = 'Medellín, Colombia';
      isVillage = false;
    } else if (lower.includes('rotterdam')) {
      targetCoords = [51.9244, 4.4777];
      targetName = 'Rotterdam Europort Terminal';
      locationDesc = 'Rotterdam, Netherlands';
      isVillage = false;
    } else if (lower.includes('zermatt')) {
      targetCoords = [45.9765, 7.7491];
      targetName = 'Zermatt Alpine Pass';
      locationDesc = 'Zermatt Village, Valais, Switzerland';
      isVillage = true;
    } else if (lower.includes('eguisheim')) {
      targetCoords = [48.0425, 7.306];
      targetName = 'Eguisheim Village Sector';
      locationDesc = 'Eguisheim Village, Haut-Rhin, France';
      isVillage = true;
    } else if (lower.includes('alexandria')) {
      targetCoords = [38.8048, -77.0469];
      targetName = 'Alexandria Naval Depot Sector';
      locationDesc = 'Alexandria, Virginia, United States';
      isVillage = false;
    } else if (lower.includes('shibuya') || lower.includes('tokyo')) {
      targetCoords = [35.658, 139.7016];
      targetName = 'Shibuya Cyber Hub';
      locationDesc = 'Shibuya, Tokyo, Japan';
      isVillage = false;
    } else if (lower.includes('mombasa')) {
      targetCoords = [-4.0435, 39.6682];
      targetName = 'Mombasa Maritime Harbor';
      locationDesc = 'Mombasa, Kenya';
      isVillage = false;
    }
  }

  // 5. Determine Agency Recipient
  let agencyRecipient: AlertAgencyRecipient = 'INTERPOL_I24_7';
  if (lower.includes('europol')) {
    agencyRecipient = 'EUROPOL_SIENA';
  } else if (lower.includes('local police') || lower.includes('police') || lower.includes('constabulary')) {
    agencyRecipient = 'NATIONAL_POLICE_SOC';
  } else if (lower.includes('fincen') || lower.includes('fraud') || lower.includes('financial')) {
    agencyRecipient = 'FINANCIAL_FRAUD_FINCEN';
  } else if (lower.includes('border') || lower.includes('customs') || lower.includes('checkpoint')) {
    agencyRecipient = 'BORDER_CUSTOMS_AGENCY';
  } else if (matchedSubject?.isRedNotice) {
    agencyRecipient = 'INTERPOL_I24_7';
  }

  // 6. Determine Urgency
  let urgency: AlertUrgency = 'PRIORITY_INTERCEPT';
  if (lower.includes('red flash') || lower.includes('immediate') || lower.includes('urgent') || matchedSubject?.isRedNotice) {
    urgency = 'RED_FLASH_IMMEDIATE';
  } else if (lower.includes('surveillance') || lower.includes('trace') || lower.includes('monitor')) {
    urgency = 'SURVEILLANCE_TRACE';
  } else if (lower.includes('freeze') || lower.includes('asset') || lower.includes('block')) {
    urgency = 'FRAUD_FREEZE';
  }

  // 7. Find the closest Tactical Intercept Unit
  let closestUnit = TACTICAL_INTERCEPT_UNITS[0];
  let minDistance = calculateDistanceKm(closestUnit.baseCoordinates, targetCoords);

  for (const unit of TACTICAL_INTERCEPT_UNITS) {
    const d = calculateDistanceKm(unit.baseCoordinates, targetCoords);
    if (d < minDistance) {
      minDistance = d;
      closestUnit = unit;
    }
  }

  // If very far (e.g. across ocean), fallback to high-altitude drone or appropriate regional unit
  if (minDistance > 2500) {
    closestUnit = TACTICAL_INTERCEPT_UNITS.find((u) => u.type === 'AIR_DRONE_WING') || closestUnit;
    minDistance = Math.min(minDistance, 450); // Virtual rapid orbital/drone repositioning
  }

  // 8. Calculate ETA and Bearings
  const speed = closestUnit.averageSpeedKmH;
  const hours = minDistance / Math.max(speed, 60);
  const etaMinutes = Math.max(2, Math.round(hours * 60));
  const bearing = calculateBearingDegrees(closestUnit.baseCoordinates, targetCoords);
  const bearingCompass = degreesToCompass(bearing);

  // Corridor Security Status
  let corridorStatus: 'SECURE_CLEAR' | 'TRANSIT_ADVISORY' | 'ALPINE_PASS_RESTRICTION' | 'URBAN_RUSH_CLEARANCE' = 'SECURE_CLEAR';
  let routeDescription = `Direct high-speed corridor via ${closestUnit.baseLocation} arterial route.`;

  if (isVillage && (locationDesc.includes('Switzerland') || locationDesc.includes('Zermatt'))) {
    corridorStatus = 'ALPINE_PASS_RESTRICTION';
    routeDescription = 'Alpine Mountain Pass Corridor. Specialized all-terrain tracked intercept vehicle deployed with aerial drone escort.';
  } else if (isVillage) {
    corridorStatus = 'TRANSIT_ADVISORY';
    routeDescription = 'Rural village cadastre approach. Navigating non-motorized perimeter canals and local secondary access corridors.';
  } else if (minDistance < 25) {
    corridorStatus = 'SECURE_CLEAR';
    routeDescription = 'Immediate tactical perimeter. Fast-attack vehicle vectoring directly with sirens muted for clandestine approach.';
  } else {
    corridorStatus = 'URBAN_RUSH_CLEARANCE';
    routeDescription = 'Multi-lane automated highway corridor with priority emergency electronic beacon overrides active.';
  }

  // 9. Generate Formal Audio Confirmation Speech Text
  const agencyNameReadable = agencyRecipient
    .replace(/_/g, ' ')
    .replace('INTERPOL I24 7', 'Interpol I-24/7 Command')
    .replace('EUROPOL SIENA', 'Europol SIENA Network')
    .replace('NATIONAL POLICE SOC', 'National Police Security Operations Center')
    .replace('FINANCIAL FRAUD FINCEN', 'FinCEN Financial Intelligence Detail')
    .replace('BORDER CUSTOMS AGENCY', 'Border and Customs Intercept Command');

  const coordSpoken = `${Math.abs(targetCoords[0]).toFixed(2)} degrees ${targetCoords[0] >= 0 ? 'North' : 'South'}, ${Math.abs(targetCoords[1]).toFixed(2)} degrees ${targetCoords[1] >= 0 ? 'East' : 'West'}`;

  const audioConfirmationSpeech = `Voice dispatch authenticated. Target coordinates confirmed: ${coordSpoken}, ${locationDesc}. Transmitting ${urgency.replace(/_/g, ' ')} protocol to ${agencyNameReadable}. Intercept unit ${closestUnit.callSign}, ${closestUnit.name}, deployed. Route status: en route bearing ${bearing} degrees ${bearingCompass}. Distance: ${minDistance} kilometers. Estimated arrival: ${etaMinutes} minutes. ${routeDescription} Cryptographic dispatch digest signed.`;

  // 10. Generate Dispatched Alert Object
  const generatedDigest = `ED25519: 0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10).toUpperCase()}`;

  const generatedAlert: DispatchedLawEnforcementAlert = {
    id: `VOICE-DISP-${Date.now().toString().slice(-4)}`,
    timestamp: Date.now(),
    timeFormatted: 'Just now (Voice Dispatch)',
    agencyRecipient,
    urgency,
    subjectId: matchedSubject?.id || matchedCrime?.linkedSuspectIds[0] || 'VOICE-TARGET',
    subjectName: matchedSubject?.fullName || matchedCrime?.title || targetName,
    idNumber: matchedSubject?.idNumber || 'VERBAL-COORDINATES-REF',
    birthDate: matchedSubject?.birthDate || 'N/A',
    country: matchedSubject?.country || matchedCrime?.country || 'International Sector',
    cityOrVillage: matchedSubject?.cityOrVillage || matchedCrime?.cityOrVillage || (isVillage ? 'Rural Village' : 'City Sector'),
    coordinates: targetCoords,
    fraudScore: matchedSubject?.fraudRiskScore || (matchedCrime ? 90 : 75),
    crimeCaseReference: matchedCrime?.caseNumber,
    actionRequired: `Execute immediate voice-guided dispatch. Intercept unit ${closestUnit.callSign} vectoring to coordinates ${formatCoordinates(targetCoords)}. Status: En route (ETA ${etaMinutes}m).`,
    officerNotes: `Verbal command transcript: "${transcript}". Target: ${locationDesc}. Route: ${routeDescription}`,
    deliveryStatus: 'DELIVERED',
    cryptographicDispatchDigest: generatedDigest
  };

  return {
    rawTranscript: transcript,
    isCoordinateRequest: true,
    targetName,
    matchedSubject,
    matchedCrime,
    targetCoordinates: targetCoords,
    locationDescription: locationDesc,
    isVillage,
    agencyRecipient,
    urgency,
    interceptUnit: closestUnit,
    distanceKm: minDistance,
    estimatedEtaMinutes: etaMinutes,
    bearingDegrees: bearing,
    bearingCompass,
    corridorStatus,
    routeDescription,
    audioConfirmationSpeech,
    generatedAlert
  };
}
