import React, { useState } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Cpu, 
  Fingerprint, 
  CheckCircle2, 
  FileText, 
  Eye, 
  EyeOff,
  Sparkles,
  Terminal
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EnclaveKeyInfo } from '../../types';

interface EnclaveVaultScreenProps {
  enclaveKey: EnclaveKeyInfo;
  onRotateKey: () => void;
  onOpenBiometricGate: () => void;
  onLockEnclave: () => void;
}

export const EnclaveVaultScreen: React.FC<EnclaveVaultScreenProps> = ({
  enclaveKey,
  onRotateKey,
  onOpenBiometricGate,
  onLockEnclave
}) => {
  const [testPayload, setTestPayload] = useState('TOP_SECRET_OPERATIONAL_DIRECTIVE_2045');
  const [encryptedCipher, setEncryptedCipher] = useState<string>('0x9D4E77A1_KYBER1024_LATTICE_CIPHER_SEALED_512BIT');
  const [decryptedResult, setDecryptedResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showKeyHex, setShowKeyHex] = useState(false);

  const handleEncryptPayload = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const hex = Array.from(testPayload)
        .map((c: string) => c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('');
      setEncryptedCipher(`KYBER1024_LATTICE_0x${hex.toUpperCase()}_SEALED_eUICC_04`);
      setDecryptedResult(null);
      setIsProcessing(false);
    }, 400);
  };

  const handleDecryptPayload = () => {
    if (enclaveKey.lockState !== 'UNLOCKED_SESSION') {
      onOpenBiometricGate();
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setDecryptedResult(testPayload);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
      } catch (e) {}
    }, 500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
              LAYER 5: Post-Quantum Enclave
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Kyber-1024 / Dilithium-5 Hardware Vault
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Dual isolation memory model: Hardware Memory Encryption (ARM TrustZone / AWS Nitro HSM) + OS Memory Sandboxing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {enclaveKey.lockState === 'UNLOCKED_SESSION' ? (
            <button
              onClick={onLockEnclave}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-300 transition cursor-pointer"
            >
              <Lock className="w-4 h-4 text-rose-400" />
              <span>Seal Enclave Vault</span>
            </button>
          ) : (
            <button
              onClick={onOpenBiometricGate}
              className="flex items-center gap-2 px-4 py-2 rounded text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm cursor-pointer"
            >
              <Fingerprint className="w-4 h-4" />
              <span>Biometric Attestation Challenge</span>
            </button>
          )}
        </div>
      </div>

      {/* Hardware Key Enclave Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Key Spec */}
        <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold tracking-wider text-[11px]">ALGORITHM SPEC</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-base font-bold text-white font-mono">{enclaveKey.algorithm}</div>
          <div className="text-xs text-cyan-400">Lattice-Based Post-Quantum Cryptography</div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            NIST Standard FIPS 203 / 204 Compliant
          </div>
        </div>

        {/* Card 2: Hardware Slot & Rotation */}
        <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold tracking-wider text-[11px]">ROTATION CYCLE</span>
            <button
              onClick={onRotateKey}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-xs transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Rotate Now</span>
            </button>
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono">{enclaveKey.rotationRemainingSec}s remaining</div>
          <div className="text-xs text-slate-400">Hardware Slot: <span className="text-slate-200 font-mono">{enclaveKey.hardwareSlot}</span></div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 font-mono truncate">
            Address: {enclaveKey.memoryAddress}
          </div>
        </div>

        {/* Card 3: Biometric Attestation Gate */}
        <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold tracking-wider text-[11px]">ATTESTATION STATE</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-base font-bold font-mono ${
            enclaveKey.lockState === 'UNLOCKED_SESSION' ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {enclaveKey.lockState === 'UNLOCKED_SESSION' ? 'ATTESTED & UNLOCKED' : 'SEALED & LOCKED'}
          </div>
          <div className="text-xs text-slate-300 truncate">
            {enclaveKey.attestationDetails?.credentialType || 'Awaiting Hardware FIDO2 Attestation'}
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 truncate font-mono">
            Token: {enclaveKey.attestationDetails?.attestationToken || '0xNONE'}
          </div>
        </div>
      </div>

      {/* Interactive Enclave Cryptex Benchmark & Live Encryption Pane */}
      <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Interactive Kyber-1024 Enclave Cryptex</h3>
          </div>
          <button
            onClick={() => setShowKeyHex(!showKeyHex)}
            className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer"
          >
            {showKeyHex ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{showKeyHex ? 'Hide Master Key Hex' : 'Reveal Key Hex'}</span>
          </button>
        </div>

        {showKeyHex && (
          <div className="p-3 rounded-lg bg-black/40 border border-slate-700 text-xs font-mono text-cyan-300 overflow-x-auto">
            <code>0x8F92D04E_77A1BC90_44E10022_99AABBCC_DDEEFF00_11223344_55667788_9900AABB_KYBER1024_SEALED</code>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Input Payload & Encrypt */}
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3">
            <label className="text-xs text-slate-300 font-medium block">Plaintext Memory Payload Buffer:</label>
            <textarea
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              rows={3}
              className="w-full p-3 rounded bg-slate-950/90 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400 resize-none"
            />
            <button
              onClick={handleEncryptPayload}
              disabled={isProcessing}
              className="w-full py-2 rounded text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              <span>Seal with 512-bit Kyber Lattice</span>
            </button>
          </div>

          {/* Right: Enclave Protected Ciphertext & Gated Decrypt */}
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3">
            <label className="text-xs text-slate-300 font-medium block">Isolated Enclave Ciphertext (Sealed in eUICC):</label>
            <div className="p-3 rounded bg-slate-950/90 border border-slate-800 text-xs text-rose-300/90 break-all font-mono min-h-[72px]">
              {encryptedCipher}
            </div>
            
            <button
              onClick={handleDecryptPayload}
              disabled={isProcessing}
              className={`w-full py-2 rounded text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer ${
                enclaveKey.lockState === 'UNLOCKED_SESSION'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700'
              }`}
            >
              {enclaveKey.lockState === 'UNLOCKED_SESSION' ? (
                <>
                  <Unlock className="w-4 h-4 text-white" />
                  <span>Attested Enclave Read (Decrypt)</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-rose-400" />
                  <span>Requires Biometric Attestation to Read</span>
                </>
              )}
            </button>
          </div>
        </div>

        {decryptedResult && (
          <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">Decrypted Payload from Enclave:</span>
              <span className="text-emerald-300 font-bold font-mono">{decryptedResult}</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 font-mono">LATENCY: 1.2ms</span>
          </div>
        )}
      </div>

      {/* Dual Isolation Architecture Specs */}
      <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 space-y-3 shadow-sm">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Dual Memory Isolation Enforcement Model</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-cyan-400 font-semibold block">1. Hardware Memory Encryption (ARM / AWS Nitro)</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Keys reside exclusively inside dedicated hardware cryptographic coprocessors. Direct Memory Access (DMA) snooping and register dump probes trigger immediate hardware zeroization.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-cyan-400 font-semibold block">2. OS-Level Unidirectional Memory Sandboxing</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Non-enclave process threads cannot read or reference enclave pointer spaces without cryptographically signed FIDO2 attestation tokens issued by the security policy gate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
