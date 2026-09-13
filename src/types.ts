export type NavigationScreen = 
  | 'dashboard'
  | 'locator'
  | 'chatbot'
  | 'neural'
  | 'enclave'
  | 'radar'
  | 'shield'
  | 'matrix'
  | 'validation'
  | 'tasks'
  | 'aws_deploy'
  | 'documents';

export type ThreatSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type PolicyEnforcementLevel = 'STRICT' | 'BALANCED' | 'DEVELOPMENT';

export type EnclaveLockState = 'LOCKED' | 'UNLOCKED_SESSION' | 'ROTATING' | 'ATTESTING' | 'DENIED';

export type IntentRiskLevel = 'SAFE' | 'ELEVATED' | 'RESTRICTED' | 'ISOLATED';

export type AgentStatus = 'ACTIVE' | 'IDLE' | 'ANALYZING' | 'SECURING' | 'QUARANTINED';

export interface BiometricAttestationDetails {
  credentialType: string;
  attestationToken: string;
  biometricStrength: string;
  hardwareSecurityModule: string;
  verifiedTimestamp: number;
}

export interface EnclaveKeyInfo {
  keyId?: string;
  algorithm: string;
  keySizeBits?: number;
  hardwareSlot: string;
  memoryAddress: string;
  rotationRemainingSec: number;
  activeState?: string;
  lockState: EnclaveLockState;
  lastRotationTimestamp?: number;
  attestationDetails?: BiometricAttestationDetails | null;
}

export interface SubAgentThread {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  neuralLoad: number; // 0.0 to 1.0
  latencyMs: number;
  handledTasks: number;
  memoryAllocation: string;
  cryptographicSignature: string;
}

export interface CyberNode {
  id: string;
  name: string;
  shortLabel: string;
  tierNumber: number;
  tierLabel: string;
  description: string;
  normalizedX: number;
  normalizedY: number;
  securityProtocol: string;
  latencyNs: number;
  activeLoad: number; // 0.0 to 1.0
  isHardwareEnclave: boolean;
  activePackets: number;
}

export interface CyberNodeRoute {
  id: string;
  name: string;
  intentType: string;
  description: string;
  nodeHops: string[];
  riskLevel: IntentRiskLevel;
  latencyMs: number;
  cryptographicDigest: string;
  isSimulated?: boolean;
}

export interface NeuralTopologyNode {
  nodeId: string;
  label: string;
  role: string;
  normalizedX: number;
  normalizedY: number;
  activeTrafficRate: number;
  isPrimaryCore?: boolean;
}

export interface NeuralIntentPattern {
  id: string;
  timestamp: number;
  sourceNode: string;
  targetNode: string;
  intentType: string;
  classification: string;
  confidenceScore: number;
  entropyDelta: number;
  latencyMs: number;
  riskLevel: IntentRiskLevel;
  synchronicHash: string;
  activeState: string;
}

export interface SecurityPolicyRule {
  id: string;
  name: string;
  category: 'NEURAL_GATE' | 'ENCLAVE_CRYPTO' | 'TELEMETRY_PRIVACY' | 'SHIELD_DEFENSE' | 'AUTONOMOUS_VALIDATION' | 'AWS_PERIMETER';
  description: string;
  isEnabled: boolean;
  minimumTier: number;
  requiresBiometricConfirmation: boolean;
  enforcementAction: string;
}

export interface TelemetryThroughputPoint {
  timestamp: number;
  rawThroughputKbps: number;
  sanitizedThroughputKbps: number;
  packetsPerSec: number;
  piiScrubbedRate: number;
  threatAnomalyScore: number;
  differentialEpsilon: number;
}

export type RadarThreatLevel = 'FRIENDLY' | 'NEUTRAL' | 'HOSTILE' | 'UNKNOWN';
export type TargetClassification = 'OPERATIVE' | 'INTRUDER' | 'SYNTHETIC_DRONE' | 'UNKNOWN_ENTITY' | 'GHOST_SIGNATURE';

export interface RadarTarget {
  id: string;
  codeName: string;
  classification: TargetClassification;
  threatLevel: RadarThreatLevel;
  rangeMeters: number;
  bearingDegrees: number;
  velocityKmh: number;
  headingDegrees: number;
  altitudeMeters: number;
  isTraceLocked: boolean;
  matchedSubjectId?: string | null;
  confidence: number;
  signalStrengthDbm: number;
  trajectoryHistory: [number, number][]; // [range, bearing]
}

export type CheckpointType = 
  | 'BORDER_CONTROL' 
  | 'BIOMETRIC_CCTV' 
  | 'HOTEL_LODGING' 
  | 'ATM_TRANSACTION' 
  | 'FLIGHT_PASSENGER' 
  | 'CELLULAR_TOWER'
  | 'MARITIME_PORT'
  | 'POLICE_CHECKPOINT';

export interface TrackWaypoint {
  id: string;
  timestamp: number;
  timeFormatted: string;
  locationName: string;
  country: string;
  cityOrVillage: string;
  isVillage: boolean;
  coordinates: [number, number]; // [lat, lng]
  checkpointType: CheckpointType;
  accuracyMeters: number;
  ipOrImsi: string;
  speedKmh?: number;
  notes: string;
  statusFlag: 'VERIFIED' | 'SUSPICIOUS' | 'FRAUD_FLAGGED';
}

export type FraudCategory = 
  | 'VELOCITY_IMPOSSIBLE_TRAVEL' 
  | 'IDENTITY_CHECKSUM_MISMATCH' 
  | 'BIOMETRIC_ANOMALY' 
  | 'CONCURRENT_GEO_USAGE' 
  | 'PHANTOM_VILLAGE_REGISTRY' 
  | 'FINANCIAL_BLACKLIST';

export interface FraudIndicator {
  id: string;
  code: string;
  name: string;
  category: FraudCategory;
  severity: ThreatSeverity;
  riskWeight: number; // 0 - 100
  description: string;
  evidence: string;
  isTriggered: boolean;
}

export type FraudRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface SubjectIdentity {
  id: string;
  idNumber: string; // National ID, Passport, or Interpol Notice ID
  operativeCode: string;
  fullName: string;
  aliases?: string[];
  birthDate: string; // YYYY-MM-DD
  age?: number;
  country: string;
  cityOrVillage: string;
  isVillage: boolean;
  coordinates?: [number, number]; // [lat, lng]
  clearanceLevel: string;
  affiliation: string;
  threatRating: ThreatSeverity;
  isRedNotice: boolean;
  biometricHash: string;
  facialConfidence: number;
  voiceConfidence: number;
  shadowSilhouetteScore: number;
  footstepsGaitScore: number;
  lastKnownCoordinates: string;
  primaryThreatVector: string;
  profileStatus: string;
  fraudRiskScore: number; // 0 - 100
  fraudLevel: FraudRiskLevel;
  fraudIndicators: FraudIndicator[];
  trackWaypoints: TrackWaypoint[];
  linkedCrimeIds: string[];
}

export type CrimeCategory = 
  | 'FINANCIAL_FRAUD_MONEY_LAUNDERING'
  | 'SYNTHETIC_IDENTITY_THEFT'
  | 'BORDER_INFILTRATION'
  | 'CYBER_EXFILTRATION'
  | 'CONTRABAND_TRAFFICKING'
  | 'SYNTHETIC_CREDENTIAL_FORGERY'
  | 'CORRUPTION_RACKETEERING';

export type CrimeStatus = 'ACTIVE_INVESTIGATION' | 'WANTED_FUGITIVE' | 'INTERCEPTED' | 'COLD_CASE';

export interface CrimeIncident {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  category: CrimeCategory;
  severity: ThreatSeverity;
  country: string;
  cityOrVillage: string;
  isVillage: boolean;
  coordinates: [number, number]; // [lat, lng]
  timestamp: number;
  dateFormatted: string;
  status: CrimeStatus;
  estimatedDamagesUsd?: number;
  linkedSuspectIds: string[];
  evidenceDigest: string;
}

export type AlertAgencyRecipient = 
  | 'INTERPOL_I24_7' 
  | 'EUROPOL_SIENA' 
  | 'NATIONAL_POLICE_SOC' 
  | 'FINANCIAL_FRAUD_FINCEN' 
  | 'BORDER_CUSTOMS_AGENCY';

export type AlertUrgency = 
  | 'RED_FLASH_IMMEDIATE' 
  | 'PRIORITY_INTERCEPT' 
  | 'SURVEILLANCE_TRACE' 
  | 'FRAUD_FREEZE';

export interface DispatchedLawEnforcementAlert {
  id: string;
  timestamp: number;
  timeFormatted: string;
  agencyRecipient: AlertAgencyRecipient;
  urgency: AlertUrgency;
  subjectId: string;
  subjectName: string;
  idNumber: string;
  birthDate: string;
  country: string;
  cityOrVillage: string;
  coordinates: [number, number];
  fraudScore: number;
  crimeCaseReference?: string;
  actionRequired: string;
  officerNotes?: string;
  deliveryStatus: 'DELIVERED' | 'BROADCASTING' | 'ACKNOWLEDGED';
  cryptographicDispatchDigest: string;
}

export interface LocatorFilterState {
  searchQuery: string;
  idNumber: string;
  name: string;
  birthDate: string;
  country: string;
  cityVillage: string;
  onlyVillages: boolean;
  minFraudScore: number;
  crimeCategory: string;
  threatSeverity: string;
  seekRadiusKm: number;
}

export interface FacialRecognitionScan {
  subjectId: string;
  subjectName: string;
  matchConfidence: number;
  livenessScore: number;
  landmarkCount: number;
  pupillaryDistanceMm: number;
  headPoseRollPitchYaw: [number, number, number];
  antiSpoofAttestation: boolean;
  microExpressionIndex: number;
  biometricVectorDigest: string;
}

export interface VoiceprintRecognitionScan {
  subjectId: string;
  subjectName: string;
  matchConfidence: number;
  pitchHz: number;
  formantF1Hz: number;
  formantF2Hz: number;
  formantF3Hz: number;
  deepfakeSyntheticScore: number;
  speakerDiarizationId: string;
  spectralBandEnergies: number[];
}

export interface ShadowSilhouetteScan {
  subjectId: string;
  subjectName: string;
  matchConfidence: number;
  estimatedHeightCm: number;
  shoulderToHipRatio: number;
  volumetricGaitSymmetry: number;
  ambientOcclusionLux: number;
  silhouetteProfileDigest: string;
}

export interface FootstepsGaitScan {
  subjectId: string;
  subjectName: string;
  matchConfidence: number;
  cadenceSpm: number;
  groundForceNewtons: number;
  heelToePressureRatio: number;
  seismicSensorId: string;
  gaitResonanceHz: number;
  groundImpulseWaveform: number[];
}

export type TelemetryAnomalyType = 
  | 'UNMASKED_PII_LEAK'
  | 'PROMPT_INJECTION_PAYLOAD'
  | 'DIFFERENTIAL_PRIVACY_VIOLATION'
  | 'MEMORY_REGISTER_EXFIL'
  | 'RETINAL_BIOMETRIC_EXPOSURE'
  | 'SURGE_PACKET_ANOMALY';

export interface TelemetryAnomalyAlert {
  id: string;
  timestamp: number;
  anomalyType: TelemetryAnomalyType;
  severity: ThreatSeverity;
  riskScore: number;
  title: string;
  description: string;
  detectedPayloadSnippet: string;
  redactionRuleApplied: string;
  affectedDomainOrNode: string;
  isMitigated: boolean;
  mitigationActionTaken?: string | null;
  cryptographicFingerprint: string;
}

export interface ValidationProof {
  id: string;
  name: string;
  description: string;
  status: string;
  verificationDigest: string;
  isPassing: boolean;
  latencyMs?: number;
  timestamp?: number;
}

export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  updated?: string;
  parent?: string;
  securityTier?: string;
  associatedAlertId?: string;
}

export interface GoogleTaskList {
  id: string;
  title: string;
  updated?: string;
}

export interface AwsDeploymentConfig {
  region: string;
  environment: 'production' | 'staging' | 'disaster-recovery';
  computePlatform: 'ecs_fargate' | 'eks_nitro' | 'app_runner';
  wafMode: 'STRICT_BLOCK' | 'ADAPTIVE_CHALLENGE' | 'LOG_ONLY';
  kmsKeySpec: 'RSA_4096_PQ_LATTICE' | 'SYMMETRIC_DEFAULT' | 'ECC_NIST_P384';
  nitroEnclavesEnabled: boolean;
  multiAzDeployment: boolean;
  auroraPostgresEnabled: boolean;
  autoScalingMin: number;
  autoScalingMax: number;
  targetCpuUtilization: number;
  sslTlsVersion: 'TLS_1_3_ONLY' | 'TLS_1_2_MIN';
}

export interface AwsReadinessCheck {
  id: string;
  pillar: 'Security' | 'Reliability' | 'Performance' | 'Cost Optimization' | 'Operational Excellence';
  title: string;
  description: string;
  status: 'PASSED' | 'OPTIMIZED' | 'WARNING' | 'REQUIRED';
  recommendation: string;
  awsService: string;
  codeReference?: string;
}

export type SecurityDocCategory = 'WHITEPAPER' | 'COMPLIANCE_CERT' | 'SPECIFICATION' | 'POLICY_MANUAL';

export interface SecurityDocument {
  id: string;
  title: string;
  category: SecurityDocCategory;
  classification: 'TOP SECRET' | 'RESTRICTED' | 'CONFIDENTIAL' | 'PUBLIC_ATTESTATION';
  version: string;
  effectiveDate: string;
  author: string;
  complianceStandard: string;
  summary: string;
  badge: string;
  status: 'ACTIVE_ATTESTED' | 'VALIDATED' | 'REVISED';
  cryptographicDigest: string;
  sections: { heading: string; content: string }[];
}

export type SecurityActionType = 
  | 'REMOVE_ALERT'
  | 'REMOVE_ALL_MITIGATED'
  | 'MITIGATE_ALERT'
  | 'ROTATE_KEY'
  | 'LOCK_ENCLAVE'
  | 'SET_POLICY'
  | 'DISPATCH_REMOTE_ALERT'
  | 'RUN_AUDIT'
  | 'EXPORT_PDF';

export interface ChatSecurityAction {
  type: SecurityActionType;
  targetId?: string;
  details?: string;
  status: 'EXECUTED' | 'FAILED' | 'PENDING';
  resultMessage?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  actionExecuted?: ChatSecurityAction;
  isVoiceTranscript?: boolean;
}

export interface RemoteAlertDispatch {
  id: string;
  alertId: string;
  title: string;
  severity: ThreatSeverity;
  targetEndpoint: string;
  dispatchedAt: number;
  status: 'DELIVERED' | 'PENDING' | 'FAILED';
  signature: string;
  payloadSnippet: string;
  protocol: 'HTTPS_WEBHOOK' | 'SIEM_SYSLOG' | 'ENCLAVE_PUB_SUB';
}


