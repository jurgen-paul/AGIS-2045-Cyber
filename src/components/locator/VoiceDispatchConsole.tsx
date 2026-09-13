import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Send,
  Compass,
  Navigation,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Clock,
  Sparkles,
  RefreshCw,
  Copy,
  ExternalLink,
  Flame,
  Home,
  Building,
  RotateCcw,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import {
  SubjectIdentity,
  CrimeIncident,
  DispatchedLawEnforcementAlert,
  AlertAgencyRecipient,
  AlertUrgency
} from '../../types';
import { formatCoordinates } from '../../utils/geoUtils';
import { SpeechTalkRecognition } from '../../services/securityChatService';
import {
  tacticalAudio,
  speakTacticalConfirmation,
  stopTacticalSpeech
} from '../../services/voiceAudioEngine';
import {
  parseVoiceDispatchRequest,
  VoiceDispatchParseResult,
  TACTICAL_INTERCEPT_UNITS
} from '../../services/voiceDispatchService';

interface VoiceDispatchConsoleProps {
  subjects: SubjectIdentity[];
  crimes: CrimeIncident[];
  onDispatchAlert: (alert: DispatchedLawEnforcementAlert) => void;
  onCenterOnCoordinates?: (coords: [number, number], zoom?: number) => void;
  onSelectSubject?: (subject: SubjectIdentity) => void;
  onSelectCrime?: (crime: CrimeIncident) => void;
}

export function VoiceDispatchConsole({
  subjects,
  crimes,
  onDispatchAlert,
  onCenterOnCoordinates,
  onSelectSubject,
  onSelectCrime
}: VoiceDispatchConsoleProps) {
  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Audio playback states
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [radioSquelchEnabled, setRadioSquelchEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Active parsed result
  const [activeResult, setActiveResult] = useState<VoiceDispatchParseResult | null>(null);

  // Countdown timer for active route ETA
  const [etaRemainingSeconds, setEtaRemainingSeconds] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // History of verbal dispatches
  const [voiceDispatchHistory, setVoiceDispatchHistory] = useState<VoiceDispatchParseResult[]>([]);

  const recognitionRef = useRef<SpeechTalkRecognition | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    recognitionRef.current = new SpeechTalkRecognition(
      (transcript: string, isFinal: boolean) => {
        if (isFinal) {
          setFinalTranscript(transcript);
          setInterimTranscript('');
          handleProcessVoiceCommand(transcript);
        } else {
          setInterimTranscript(transcript);
        }
      },
      (err: string) => {
        setIsListening(false);
        setSpeechError(`Microphone notice: ${err}`);
      },
      () => {
        setIsListening(false);
      }
    );

    // Initial default demonstration dispatch on mount
    const defaultResult = parseVoiceDispatchRequest(
      'Dispatch Interpol to Giethoorn village coordinates 52.74, 6.08',
      subjects,
      crimes
    );
    setActiveResult(defaultResult);
    setEtaRemainingSeconds(defaultResult.estimatedEtaMinutes * 60);

    return () => {
      recognitionRef.current?.stop();
      stopTacticalSpeech();
    };
  }, [subjects, crimes]);

  // ETA countdown timer
  useEffect(() => {
    if (etaRemainingSeconds === null || etaRemainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setEtaRemainingSeconds((prev) => (prev && prev > 1 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [etaRemainingSeconds]);

  // Handle toggling the voice microphone
  const toggleListening = () => {
    setSpeechError(null);
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (radioSquelchEnabled) {
        tacticalAudio.playMicListeningBeep(0.2);
      }
      const started = recognitionRef.current?.start();
      if (started) {
        setIsListening(true);
        setInterimTranscript('');
        stopTacticalSpeech();
      } else {
        setSpeechError(
          'Web Speech Recognition is not supported or permission was denied. You can use the tactical text console or sample voice chips below.'
        );
      }
    }
  };

  // Process voice command transcript
  const handleProcessVoiceCommand = (command: string) => {
    if (!command.trim()) return;

    // Chime
    if (radioSquelchEnabled) {
      tacticalAudio.playRouteConfirmedChime(0.25);
    }

    const result = parseVoiceDispatchRequest(command, subjects, crimes);
    setActiveResult(result);
    setEtaRemainingSeconds(result.estimatedEtaMinutes * 60);

    // Auto-record to dispatch history
    setVoiceDispatchHistory((prev) => [result, ...prev.slice(0, 7)]);

    // Call onDispatchAlert to sync with application SIEM state
    onDispatchAlert(result.generatedAlert);

    // Center on coordinates if callback provided
    if (onCenterOnCoordinates) {
      onCenterOnCoordinates(result.targetCoordinates, 2.5);
    }

    // Play verbal audio confirmation of route status
    if (audioEnabled) {
      playAudioConfirmation(result.audioConfirmationSpeech);
    }
  };

  // Play audio confirmation
  const playAudioConfirmation = (speechText: string) => {
    setIsSpeaking(true);
    speakTacticalConfirmation(speechText, {
      rate: 1.04,
      pitch: 0.95,
      playSquelchBefore: radioSquelchEnabled,
      playSquelchAfter: radioSquelchEnabled,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false)
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setFinalTranscript(manualInput);
    handleProcessVoiceCommand(manualInput);
    setManualInput('');
  };

  const handleCopyCoords = () => {
    if (!activeResult) return;
    const str = `${activeResult.targetCoordinates[0].toFixed(4)}, ${activeResult.targetCoordinates[1].toFixed(4)}`;
    navigator.clipboard.writeText(str);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Quick Voice Chips
  const voiceSuggestions = [
    { label: 'Dispatch Interpol to Giethoorn', query: 'Dispatch Interpol to Giethoorn village coordinates 52.74, 6.08' },
    { label: 'Tactical Unit to Rotterdam Port', query: 'Send tactical unit to Rotterdam Port coordinates 51.92, 4.48' },
    { label: 'Route status for Marcus Vance', query: 'Request coordinates and route status for subject Marcus Vance' },
    { label: 'Intercept Elena Rostova in Medellín', query: 'Deploy intercept to Elena Rostova in Medellin' },
    { label: 'Dispatch Europol to Zermatt Village', query: 'Dispatch Europol alert to Zermatt village alpine pass' },
    { label: 'Eguisheim Village identity forge', query: 'Dispatch local police to Eguisheim village coordinates 48.04, 7.30' }
  ];

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-6">
      {/* Top Header & Comms Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`p-2.5 rounded-xl border transition ${
              isListening 
                ? 'bg-red-500/20 border-red-500 text-red-400 shadow-lg shadow-red-950/50' 
                : isSpeaking
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-950/50'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <Radio className={`w-5 h-5 ${isListening || isSpeaking ? 'animate-pulse' : ''}`} />
            </div>
            {isListening && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              VOICE-GUIDED DISPATCH & ROUTE STATUS COMMS
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                AES-GCM ENCRYPTED
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Verbal Geodetic Coordinate Request & Live Intercept Unit Audio Confirmation
            </p>
          </div>
        </div>

        {/* Audio Toggles & Controls */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setRadioSquelchEnabled(!radioSquelchEnabled)}
            className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
              radioSquelchEnabled
                ? 'bg-slate-800 text-cyan-300 border-cyan-500/30'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle Tactical Radio Squelch Sound Effects"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Radio Squelch: {radioSquelchEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => {
              if (isSpeaking) {
                stopTacticalSpeech();
                setIsSpeaking(false);
              }
              setAudioEnabled(!audioEnabled);
            }}
            className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
              audioEnabled
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle Spoken Route Audio Confirmation"
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>Audio Voice: {audioEnabled ? 'MUTED' : 'UNMUTED'}</span>
          </button>

          {activeResult && (
            <button
              onClick={() => playAudioConfirmation(activeResult.audioConfirmationSpeech)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition flex items-center gap-1.5 cursor-pointer font-bold"
              title="Hear route status confirmation again"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hear Route Status</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Microphone Action Deck */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 relative overflow-hidden">
        {/* Glow backdrop during listening */}
        {isListening && (
          <div className="absolute inset-0 bg-red-950/20 pointer-events-none animate-pulse" />
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            {/* Big Tactical Mic Button */}
            <button
              onClick={toggleListening}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition shadow-2xl cursor-pointer shrink-0 border ${
                isListening
                  ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-red-600/50 scale-105 animate-pulse'
                  : 'bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border-cyan-500/50 shadow-cyan-950/50 hover:scale-105'
              }`}
              title={isListening ? 'Click to stop listening' : 'Click to activate microphone voice command'}
            >
              {isListening ? (
                <MicOff className="w-7 h-7 text-white" />
              ) : (
                <Mic className="w-7 h-7 text-cyan-300" />
              )}
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isListening
                      ? 'bg-red-500 animate-ping'
                      : isSpeaking
                      ? 'bg-cyan-400 animate-pulse'
                      : 'bg-emerald-500'
                  }`}
                />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  {isListening
                    ? 'MICROPHONE ACTIVE • LISTENING FOR VERBAL DISPATCH COMMAND...'
                    : isSpeaking
                    ? 'TRANSMITTING AUDIO ROUTE STATUS CONFIRMATION...'
                    : 'STANDBY • READY FOR VOICE DISPATCH'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {isListening
                  ? 'Say e.g.: "Dispatch Interpol to Giethoorn village coordinates 52.74, 6.08"'
                  : 'Press the microphone or tap any tactical voice prompt below to verbally dispatch coordinates'}
              </p>
            </div>
          </div>

          {/* Audio Visualizer Wave Simulation */}
          <div className="flex items-center gap-1 h-8 px-3 bg-slate-900/90 rounded-xl border border-slate-800 shrink-0 self-start sm:self-center">
            {[40, 75, 20, 90, 60, 30, 85, 45, 100, 50, 70, 35].map((height, idx) => (
              <span
                key={idx}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isListening
                    ? 'bg-red-500 animate-bounce'
                    : isSpeaking
                    ? 'bg-cyan-400 animate-pulse'
                    : 'bg-slate-700'
                }`}
                style={{
                  height: isListening || isSpeaking ? `${height}%` : '20%',
                  animationDelay: `${idx * 0.08}s`
                }}
              />
            ))}
            <span className="text-[10px] font-mono text-slate-400 ml-1">
              {isListening ? 'LIVE MIC' : isSpeaking ? 'SPEAKING' : 'READY'}
            </span>
          </div>
        </div>

        {/* Live Transcript Banner */}
        {(interimTranscript || finalTranscript) && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 font-mono text-xs flex items-start gap-2">
            <span className="text-cyan-400 font-bold uppercase shrink-0">Captured Speech:</span>
            <span className="text-white italic">
              "{finalTranscript || interimTranscript}"
            </span>
            {interimTranscript && (
              <span className="text-cyan-400 animate-pulse">[transcribing...]</span>
            )}
          </div>
        )}

        {speechError && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/40 text-xs font-mono text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{speechError}</span>
          </div>
        )}
      </div>

      {/* Quick Voice Command Chips */}
      <div>
        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Quick Voice Prompts (Click to Verbalize Dispatch):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {voiceSuggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setFinalTranscript(item.query);
                handleProcessVoiceCommand(item.query);
              }}
              className="text-left p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white transition group cursor-pointer flex items-center justify-between gap-2"
            >
              <div className="truncate">
                <div className="text-xs font-mono font-bold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1.5">
                  <Mic className="w-3 h-3 text-cyan-400" />
                  <span>{item.label}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                  "{item.query}"
                </div>
              </div>
              <span className="text-slate-500 group-hover:text-cyan-400 text-xs">→</span>
            </button>
          ))}
        </div>
      </div>

      {/* Manual Input Fallback */}
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <input
          type="text"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Type coordinate or verbal request (e.g. 'Dispatch Interpol to coordinates 52.74, 6.08')..."
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-slate-500 outline-none"
        />
        <button
          type="submit"
          disabled={!manualInput.trim()}
          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Dispatch</span>
        </button>
      </form>

      {/* Active Tactical Route Status Card */}
      {activeResult && (
        <div className="bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-[#0A101D] border-2 border-cyan-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          {/* Subtle tactical grid background */}
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Compass className="w-48 h-48 text-cyan-400" />
          </div>

          <div className="relative z-10 space-y-4">
            {/* Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Navigation className="w-5 h-5 animate-pulse" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      LAW ENFORCEMENT ROUTE STATUS:
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                      UNIT EN ROUTE
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">
                    Target: <strong className="text-cyan-300">{activeResult.targetName}</strong> •{' '}
                    {activeResult.locationDescription} {activeResult.isVillage ? '🏡 (Village)' : '🏢 (City)'}
                  </div>
                </div>
              </div>

              {/* Agency Protocol Pill */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-mono font-bold">
                  {activeResult.agencyRecipient.replace(/_/g, ' ')}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                  {activeResult.urgency.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Grid of Telemetry */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Confirmed Coordinates */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Locked Coordinates</span>
                  <button
                    onClick={handleCopyCoords}
                    className="text-slate-400 hover:text-white cursor-pointer"
                    title="Copy coordinates"
                  >
                    {isCopied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="text-sm font-mono font-bold text-cyan-300 mt-1 truncate">
                  {formatCoordinates(activeResult.targetCoordinates)}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                  Lat: {activeResult.targetCoordinates[0].toFixed(4)}, Lng: {activeResult.targetCoordinates[1].toFixed(4)}
                </div>
              </div>

              {/* Tactical Unit Call Sign */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  <span>Intercept Unit</span>
                </div>
                <div className="text-sm font-mono font-bold text-white mt-1 truncate">
                  {activeResult.interceptUnit.callSign}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                  {activeResult.interceptUnit.name}
                </div>
              </div>

              {/* Transit Distance & Speed */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3 h-3 text-cyan-400" />
                  <span>Vector Distance</span>
                </div>
                <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
                  {activeResult.distanceKm} km
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Bearing: {activeResult.bearingDegrees}° ({activeResult.bearingCompass})
                </div>
              </div>

              {/* ETA Countdown Timer */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-red-400" />
                  <span>Estimated Intercept</span>
                </div>
                <div className="text-sm font-mono font-bold text-red-400 mt-1 flex items-center gap-1">
                  <span>{activeResult.estimatedEtaMinutes} min</span>
                  {etaRemainingSeconds !== null && (
                    <span className="text-[11px] font-mono text-slate-400 font-normal">
                      ({Math.floor(etaRemainingSeconds / 60)}m {etaRemainingSeconds % 60}s)
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                  Speed: ~{activeResult.interceptUnit.averageSpeedKmH} km/h
                </div>
              </div>
            </div>

            {/* Tactical Route Corridor Description */}
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  ROUTE CORRIDOR TELEMETRY:
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    activeResult.corridorStatus === 'SECURE_CLEAR'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : activeResult.corridorStatus === 'ALPINE_PASS_RESTRICTION'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  }`}
                >
                  {activeResult.corridorStatus.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-300 leading-relaxed">
                {activeResult.routeDescription} Unit deployed from base at{' '}
                <strong className="text-white">{activeResult.interceptUnit.baseLocation}</strong>.
              </p>
              <div className="text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800/80 flex items-center justify-between">
                <span className="truncate">
                  Digest: <code className="text-cyan-400">{activeResult.generatedAlert.cryptographicDispatchDigest}</code>
                </span>
                <span className="text-emerald-400 font-bold shrink-0 ml-2">✓ SIEM Wire Logged</span>
              </div>
            </div>

            {/* Tactical Quick Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => playAudioConfirmation(activeResult.audioConfirmationSpeech)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 hover:text-white border border-cyan-500/50 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Replay Audio Confirmation</span>
                </button>

                {onCenterOnCoordinates && (
                  <button
                    onClick={() => onCenterOnCoordinates(activeResult.targetCoordinates, 2.5)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Focus on SeekMap</span>
                  </button>
                )}

                {activeResult.matchedSubject && onSelectSubject && (
                  <button
                    onClick={() => onSelectSubject(activeResult.matchedSubject!)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Track Dossier</span>
                  </button>
                )}

                {activeResult.matchedCrime && onSelectCrime && (
                  <button
                    onClick={() => onSelectCrime(activeResult.matchedCrime!)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    <span>Case Incident</span>
                  </button>
                )}
              </div>

              <span className="text-[11px] font-mono text-slate-500">
                Automatic Attestation Broadcast Active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Voice Dispatch Log & Audio Archive */}
      {voiceDispatchHistory.length > 0 && (
        <div className="border-t border-slate-800 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>VOICE DISPATCH ARCHIVE & COMMS LOG ({voiceDispatchHistory.length} TRANSMISSIONS)</span>
            </h3>
            <button
              onClick={() => setVoiceDispatchHistory([])}
              className="text-xs text-slate-500 hover:text-slate-300 font-mono"
            >
              Clear Log
            </button>
          </div>

          <div className="space-y-2">
            {voiceDispatchHistory.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                      {item.interceptUnit.callSign}
                    </span>
                    <span className="text-white font-bold">{item.targetName}</span>
                    <span className="text-slate-400">
                      • {formatCoordinates(item.targetCoordinates)}
                    </span>
                    <span className="text-slate-500">
                      • {item.agencyRecipient.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px] italic line-clamp-1">
                    "{item.rawTranscript}"
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-emerald-400 font-bold bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/20">
                    {item.distanceKm}km • {item.estimatedEtaMinutes}m ETA
                  </span>
                  <button
                    onClick={() => playAudioConfirmation(item.audioConfirmationSpeech)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 cursor-pointer"
                    title="Replay Audio Confirmation"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  {onCenterOnCoordinates && (
                    <button
                      onClick={() => onCenterOnCoordinates(item.targetCoordinates, 2.5)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-slate-700 cursor-pointer"
                      title="Focus on SeekMap"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
