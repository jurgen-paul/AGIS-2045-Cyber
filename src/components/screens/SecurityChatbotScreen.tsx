import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Trash2, 
  RotateCw, 
  Lock, 
  ShieldAlert, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ExternalLink,
  Terminal,
  Activity,
  Zap,
  Globe,
  Share2,
  ArrowRight,
  Fingerprint
} from 'lucide-react';
import { 
  ChatMessage, 
  ChatSecurityAction, 
  TelemetryAnomalyAlert, 
  EnclaveKeyInfo, 
  PolicyEnforcementLevel, 
  ValidationProof, 
  RemoteAlertDispatch,
  ThreatSeverity
} from '../../types';
import { 
  sendChatMessage, 
  SpeechTalkRecognition, 
  SpeechTalkSynthesizer 
} from '../../services/securityChatService';

interface SecurityChatbotScreenProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, isVoice?: boolean) => Promise<void>;
  alerts: TelemetryAnomalyAlert[];
  onRemoveAlert: (alertId: string) => void;
  onRemoveAllMitigated: () => void;
  onMitigateAlert: (alertId: string) => void;
  onRotateKey: () => void;
  onLockEnclave: () => void;
  onSetPolicyLevel: (level: PolicyEnforcementLevel) => void;
  onOpenBiometricGate: () => void;
  enclaveKey: EnclaveKeyInfo;
  policyLevel: PolicyEnforcementLevel;
  proofs: ValidationProof[];
  remoteAlerts: RemoteAlertDispatch[];
  onDispatchRemoteAlert: (alertId: string, endpoint?: string) => Promise<void>;
  onClearChat: () => void;
}

export const SecurityChatbotScreen: React.FC<SecurityChatbotScreenProps> = ({
  messages,
  onSendMessage,
  alerts,
  onRemoveAlert,
  onRemoveAllMitigated,
  onMitigateAlert,
  onRotateKey,
  onLockEnclave,
  onSetPolicyLevel,
  onOpenBiometricGate,
  enclaveKey,
  policyLevel,
  proofs,
  remoteAlerts,
  onDispatchRemoteAlert,
  onClearChat
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedAlertForRemote, setSelectedAlertForRemote] = useState<string>(alerts[0]?.id || '');
  const [remoteEndpoint, setRemoteEndpoint] = useState('https://soc.cybernode.aegis.cloud/api/v1/ingest');
  const [isDispatchingRemote, setIsDispatchingRemote] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechTalkRecognition | null>(null);

  // Auto scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Read aloud last message if voice output is enabled
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'assistant' && voiceOutputEnabled) {
        setIsSpeaking(true);
        SpeechTalkSynthesizer.speak(lastMsg.text, () => {
          setIsSpeaking(false);
        });
      }
    }
  }, [messages, voiceOutputEnabled]);

  // Initialize Speech Recognition
  useEffect(() => {
    const recognition = new SpeechTalkRecognition(
      (transcript, isFinal) => {
        setInputText(transcript);
        if (isFinal && transcript.trim()) {
          setIsListening(false);
          handleSend(transcript, true);
        }
      },
      (error) => {
        console.warn('Speech recognition error:', error);
        setIsListening(false);
        setSpeechError(`Voice capture: ${error}`);
        setTimeout(() => setSpeechError(null), 4000);
      },
      () => {
        setIsListening(false);
      }
    );
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      SpeechTalkSynthesizer.stop();
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current?.isSupported()) {
      setSpeechError('Speech recognition is not supported in this browser environment.');
      setTimeout(() => setSpeechError(null), 4000);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setSpeechError(null);
      SpeechTalkSynthesizer.stop();
      setIsSpeaking(false);
      const started = recognitionRef.current.start();
      if (started) {
        setIsListening(true);
      }
    }
  };

  const handleSend = async (textToSend?: string, isVoice = false) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    setInputText('');
    setIsLoading(true);

    try {
      await onSendMessage(text, isVoice);
    } catch (e) {
      console.error('Chat error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickCommand = (command: string) => {
    setInputText(command);
    handleSend(command, false);
  };

  const handleManualRemoteDispatch = async () => {
    if (!selectedAlertForRemote) return;
    setIsDispatchingRemote(true);
    try {
      await onDispatchRemoteAlert(selectedAlertForRemote, remoteEndpoint);
    } finally {
      setIsDispatchingRemote(false);
    }
  };

  const unmitigatedCount = alerts.filter(a => !a.isMitigated).length;
  const mitigatedCount = alerts.filter(a => a.isMitigated).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" />
                <span>AEGIS NEURAL SECURITY CHATBOT</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30">
                GEMINI-3.8-FLASH COGNITIVE CORE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                VOICE TALK ACTIVE
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Conversational Security & Remote Telemetry Operator</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Interact via voice or text with the zero-trust cyber-node assistant. Issue autonomous security directives: 
              remove or mitigate alerts, broadcast remote SIEM incidents, rotate enclave lattice keys, and trigger biometric validations.
            </p>
          </div>

          {/* Audio & Voice Mode Controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                const nextState = !voiceOutputEnabled;
                setVoiceOutputEnabled(nextState);
                if (!nextState) SpeechTalkSynthesizer.stop();
              }}
              className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 border transition cursor-pointer ${
                voiceOutputEnabled 
                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/20' 
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Toggle Text-to-Speech voice synthesizer output"
            >
              {voiceOutputEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
              <span>Voice Talk: {voiceOutputEnabled ? 'ON' : 'MUTED'}</span>
            </button>

            <button
              onClick={onClearChat}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition cursor-pointer"
              title="Clear conversation history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Speech Error Banner if any */}
        {speechError && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{speechError}</span>
          </div>
        )}
      </div>

      {/* Two Column Layout: Left = Conversational Console, Right = Security Controls & Remote Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Chat Conversation Stream (7 cols) */}
        <div className="lg:col-span-7 bg-[#1E293B] border border-slate-800 rounded-xl p-5 flex flex-col h-[700px] shadow-sm">
          {/* Active Voice Waveform Indicator */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-cyan-400 animate-ping' : isListening ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
              <span className="text-slate-300 font-semibold">
                {isListening ? 'LISTENING TO SPEECH INPUT...' : isSpeaking ? 'NEURAL VOICE SYNTHESIZING...' : 'VOICE INTERFACE READY'}
              </span>
            </div>

            {/* Speaking animation bars */}
            {(isSpeaking || isListening) && (
              <div className="flex items-center gap-1">
                {[0.4, 0.8, 0.6, 1.0, 0.7, 0.3].map((h, i) => (
                  <span 
                    key={i} 
                    className="w-1 bg-cyan-400 rounded-full animate-pulse" 
                    style={{ height: `${h * 16}px`, animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[10px] font-mono text-slate-500">
                      {isUser ? 'AUTHORIZED OPERATOR' : 'AEGIS COGNITIVE SECURITY'}
                    </span>
                    {msg.isVoiceTranscript && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                        <Mic className="w-2.5 h-2.5" /> VOICE
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-600">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                        : 'bg-[#111827] border border-slate-800 text-slate-200'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Executed Security Action Pill */}
                    {msg.actionExecuted && (
                      <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between gap-2 text-[11px] font-mono">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>[SECURITY ACTION EXECUTED]</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 truncate max-w-[200px]">
                          {msg.actionExecuted.type}: {msg.actionExecuted.targetId || msg.actionExecuted.details || 'COMPLETED'}
                        </span>
                      </div>
                    )}
                  </div>

                  {!isUser && voiceOutputEnabled && (
                    <button
                      onClick={() => SpeechTalkSynthesizer.speak(msg.text)}
                      className="mt-1 ml-2 text-[10px] text-slate-500 hover:text-cyan-400 flex items-center gap-1 font-mono transition cursor-pointer"
                      title="Replay speech audio"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Replay Voice</span>
                    </button>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#111827] border border-slate-800 text-xs text-cyan-400 font-mono">
                <Bot className="w-4 h-4 animate-bounce" />
                <span>Analyzing quantum intent & verifying zero-trust policy gates...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Command Suggestions */}
          <div className="py-2 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono no-scrollbar">
            <span className="text-slate-500 shrink-0 uppercase text-[9px]">QUICK COMMANDS:</span>
            <button
              onClick={() => handleQuickCommand('Remove all mitigated alerts')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 shrink-0 transition cursor-pointer"
            >
              Purge Mitigated Alerts
            </button>
            {alerts[0] && (
              <button
                onClick={() => handleQuickCommand(`Remove alert ${alerts[0].id}`)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 hover:border-rose-500/50 shrink-0 transition cursor-pointer"
              >
                Remove {alerts[0].id}
              </button>
            )}
            <button
              onClick={() => handleQuickCommand('Dispatch remote alert to SIEM')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 hover:border-purple-500/50 shrink-0 transition cursor-pointer"
            >
              Broadcast Remote Alert
            </button>
            <button
              onClick={() => handleQuickCommand('Rotate post-quantum enclave key')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 hover:border-emerald-500/50 shrink-0 transition cursor-pointer"
            >
              Rotate Kyber Key
            </button>
            <button
              onClick={() => handleQuickCommand('Lock 512-bit hardware enclave')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/50 shrink-0 transition cursor-pointer"
            >
              Lock Enclave
            </button>
          </div>

          {/* Input Bar with Mic and Send Button */}
          <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
            {/* Voice Talk Mic Button */}
            <button
              onClick={toggleListening}
              className={`p-3 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-900/50 ring-2 ring-rose-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700'
              }`}
              title={isListening ? 'Click to stop listening' : 'Click to activate Voice Talk (Speech Input)'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder={isListening ? 'Listening to your voice command...' : 'Type security command, e.g. "remove alert ALERT-001" or "rotate key"...'}
              className="flex-1 bg-[#111827] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition font-mono"
            />

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isLoading}
              className="p-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white transition shadow-md disabled:opacity-40 cursor-pointer shrink-0"
              title="Send command"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Security Controls & Remote Alerts Hub (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Alert Removal & Mitigation Panel */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-semibold text-white">Alert Removal & Mitigation Center</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {alerts.length} TOTAL ({unmitigatedCount} OPEN)
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Directly remove threat telemetry records or trigger differential privacy Laplace mitigation across the active cyber-node cluster.
            </p>

            {/* Quick Purge All Mitigated */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#111827] border border-slate-800">
              <div>
                <p className="text-xs font-semibold text-slate-200">Purge Mitigated Alerts</p>
                <p className="text-[10px] text-slate-400 font-mono">{mitigatedCount} alerts ready for permanent removal</p>
              </div>
              <button
                onClick={onRemoveAllMitigated}
                disabled={mitigatedCount === 0}
                className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove All Mitigated</span>
              </button>
            </div>

            {/* Interactive Alert Items with Quick Remove / Mitigate Actions */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="p-4 rounded-lg bg-[#111827] border border-slate-800 text-center text-xs text-slate-500">
                  No active threat alerts in memory. Alert buffer is clean.
                </div>
              ) : (
                alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className="p-3 rounded-lg bg-[#111827] border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] font-bold text-slate-300">{alert.id}</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {alert.severity}
                        </span>
                        <span className={`text-[9px] font-mono ${alert.isMitigated ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {alert.isMitigated ? 'MITIGATED' : 'ACTION REQUIRED'}
                        </span>
                      </div>
                      <p className="text-slate-200 font-medium text-[11px] truncate mt-1">{alert.title}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!alert.isMitigated && (
                        <button
                          onClick={() => onMitigateAlert(alert.id)}
                          className="px-2 py-1 rounded bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono transition cursor-pointer"
                          title="Mitigate this anomaly"
                        >
                          Mitigate
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveAlert(alert.id)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition cursor-pointer"
                        title="Remove alert from memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Remote Alerts Hub ("remore alerts") */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Remote Alerts SIEM / SOC Dispatch Hub</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                EXTERNAL BROKER
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Transmit cryptographically signed incident telemetry payloads to remote enterprise SIEM endpoints, SOC analysts, and automated webhook responders.
            </p>

            {/* Quick Dispatch Form */}
            <div className="p-3.5 rounded-lg bg-[#111827] border border-slate-800 space-y-2.5">
              <div className="text-[11px] font-mono text-slate-300 font-semibold">
                BROADCAST INCIDENT TO REMOTE SOC
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Target Alert</label>
                <select
                  value={selectedAlertForRemote}
                  onChange={(e) => setSelectedAlertForRemote(e.target.value)}
                  className="w-full bg-[#0A0E17] border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
                >
                  {alerts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} - {a.title} ({a.severity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Remote SIEM Webhook URL</label>
                <input
                  type="text"
                  value={remoteEndpoint}
                  onChange={(e) => setRemoteEndpoint(e.target.value)}
                  className="w-full bg-[#0A0E17] border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                onClick={handleManualRemoteDispatch}
                disabled={isDispatchingRemote || alerts.length === 0}
                className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{isDispatchingRemote ? 'Transmitting to SIEM...' : 'Broadcast Remote Alert (TLS 1.3)'}</span>
              </button>
            </div>

            {/* Remote Alert Dispatches Log */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>RECENT REMOTE DISPATCHES ({remoteAlerts.length})</span>
                <span className="text-emerald-400">VERIFIED DELIVERIES</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {remoteAlerts.map((dispatch) => (
                  <div
                    key={dispatch.id}
                    className="p-2.5 rounded-lg bg-[#111827] border border-slate-800 font-mono text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-cyan-300 font-bold text-[11px]">{dispatch.id}</span>
                      <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{dispatch.status}</span>
                      </span>
                    </div>
                    <p className="text-slate-200 text-[11px] truncate">{dispatch.title}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="truncate">{dispatch.targetEndpoint.replace('https://', '')}</span>
                      <span>{dispatch.signature}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
