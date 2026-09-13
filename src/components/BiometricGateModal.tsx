import React, { useState, useEffect } from 'react';
import { 
  Fingerprint, 
  ShieldCheck, 
  X, 
  Lock, 
  CheckCircle2, 
  AlertOctagon, 
  Cpu, 
  KeyRound,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BiometricAttestationDetails } from '../types';

interface BiometricGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (details: BiometricAttestationDetails) => void;
  reasonTitle?: string;
  reasonDescription?: string;
}

export const BiometricGateModal: React.FC<BiometricGateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  reasonTitle = 'Zero-Trust Biometric Attestation Challenge',
  reasonDescription = 'This operation requires cryptographic hardware attestation via FIDO2 / Passkey or biometric keymaster sensor to unlock the 512-bit Kyber enclave.'
}) => {
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'attesting' | 'verified' | 'failed'>('idle');
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [selectedSensor, setSelectedSensor] = useState<'passkey' | 'retinal' | 'seismic_gait'>('passkey');

  useEffect(() => {
    if (isOpen) {
      setScanState('idle');
      setScanProgress(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartAttestation = () => {
    setScanState('scanning');
    setScanProgress(15);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          setScanState('attesting');
          setTimeout(() => {
            setScanState('verified');
            try {
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.6 }
              });
            } catch (e) {
              // ignore
            }
            setTimeout(() => {
              const details: BiometricAttestationDetails = {
                credentialType: selectedSensor === 'passkey' ? 'FIDO2 / WebAuthn Passkey' : selectedSensor === 'retinal' ? 'Neural Retinal Scan (Class 3)' : 'Seismic Gait Sensor #04',
                attestationToken: `0x${Math.random().toString(16).substring(2, 10).toUpperCase()}...${Math.random().toString(16).substring(2, 6).toUpperCase()}_ATTESTED`,
                biometricStrength: 'Class 3 (Hardware Boundary Sealed)',
                hardwareSecurityModule: 'ARM TrustZone / AWS Nitro HSM',
                verifiedTimestamp: Date.now()
              };
              onSuccess(details);
              onClose();
            }, 900);
          }, 600);
          return 100;
        }
        return prev + 18;
      });
    }, 180);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-xl bg-[#1E293B] border border-slate-700 p-6 shadow-2xl relative overflow-hidden text-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">{reasonTitle}</h2>
            <p className="text-xs text-slate-400">Hardware Security Module Attestation</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-5 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
          {reasonDescription}
        </p>

        {/* Sensor selector */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <button
            onClick={() => setSelectedSensor('passkey')}
            className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              selectedSensor === 'passkey'
                ? 'bg-slate-800 border-cyan-500 text-white shadow-sm'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <span>FIDO2 Passkey</span>
          </button>
          <button
            onClick={() => setSelectedSensor('retinal')}
            className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              selectedSensor === 'retinal'
                ? 'bg-slate-800 border-cyan-500 text-white shadow-sm'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Retinal Iris</span>
          </button>
          <button
            onClick={() => setSelectedSensor('seismic_gait')}
            className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              selectedSensor === 'seismic_gait'
                ? 'bg-slate-800 border-cyan-500 text-white shadow-sm'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Seismic Gait</span>
          </button>
        </div>

        {/* Interactive Attestation Scan Area */}
        <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-black/40 border border-slate-800 mb-6 relative overflow-hidden group">
          {/* Animated Scanner Wave */}
          {scanState === 'scanning' && (
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scanline"></div>
          )}

          <div 
            onClick={scanState === 'idle' ? handleStartAttestation : undefined}
            className={`relative w-20 h-20 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 ${
              scanState === 'idle' ? 'bg-cyan-500/10 border-2 border-dashed border-cyan-500/40 hover:scale-105 hover:border-cyan-400' :
              scanState === 'scanning' ? 'bg-cyan-500/20 border-2 border-cyan-400 animate-pulse' :
              scanState === 'attesting' ? 'bg-amber-500/20 border-2 border-amber-400 animate-spin' :
              'bg-emerald-500/20 border-2 border-emerald-400'
            }`}
          >
            {scanState === 'idle' && <Fingerprint className="w-10 h-10 text-cyan-400" />}
            {scanState === 'scanning' && <Fingerprint className="w-10 h-10 text-cyan-300 animate-pulse" />}
            {scanState === 'attesting' && <ShieldCheck className="w-10 h-10 text-amber-400" />}
            {scanState === 'verified' && <CheckCircle2 className="w-10 h-10 text-emerald-400" />}
          </div>

          <p className="mt-3 text-xs font-semibold text-center">
            {scanState === 'idle' && <span className="text-cyan-300">Click or Tap to Attest Biometrics</span>}
            {scanState === 'scanning' && <span className="text-cyan-400">Scanning Sensor... {scanProgress}%</span>}
            {scanState === 'attesting' && <span className="text-amber-300">Generating Kyber Hardware Proof...</span>}
            {scanState === 'verified' && <span className="text-emerald-400">Biometric Attestation Verified!</span>}
          </p>

          <p className="text-[11px] text-slate-400 mt-1">
            FIDO2 WebAuthn / ARM TrustZone L3 Keymaster Token
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleStartAttestation}
            disabled={scanState !== 'idle'}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded text-sm font-medium transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {scanState === 'idle' ? 'Attest & Verify' : 'Verifying...'}
          </button>
        </div>
      </div>
    </div>
  );
};
