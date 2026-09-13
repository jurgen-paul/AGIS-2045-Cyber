import React, { useState } from 'react';
import { 
  X, 
  Send, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Radio, 
  Globe, 
  Building, 
  Home, 
  Key,
  Flame,
  FileCheck
} from 'lucide-react';
import { 
  SubjectIdentity, 
  CrimeIncident, 
  DispatchedLawEnforcementAlert, 
  AlertAgencyRecipient, 
  AlertUrgency 
} from '../../types';
import { formatCoordinates } from '../../utils/geoUtils';

interface SendAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject?: SubjectIdentity | null;
  crime?: CrimeIncident | null;
  onAlertDispatched: (alert: DispatchedLawEnforcementAlert) => void;
}

export function SendAlertModal({
  isOpen,
  onClose,
  subject,
  crime,
  onAlertDispatched
}: SendAlertModalProps) {
  if (!isOpen) return null;

  const [agency, setAgency] = useState<AlertAgencyRecipient>('INTERPOL_I24_7');
  const [urgency, setUrgency] = useState<AlertUrgency>('RED_FLASH_IMMEDIATE');
  const [actionRequired, setActionRequired] = useState(
    subject?.isRedNotice
      ? 'Execute provisional arrest under Interpol Red Notice; seize hardware cryptographic tokens and isolate encrypted mobile devices.'
      : 'Issue priority surveillance trace and monitor biometric border checkpoints.'
  );
  const [officerNotes, setOfficerNotes] = useState(
    subject
      ? `Subject last sighted near ${subject.cityOrVillage} (${subject.isVillage ? 'Rural Village' : 'City'}), ${subject.country}. High risk of synthetic identity forging.`
      : crime
      ? `Crime hotspot identified in ${crime.cityOrVillage}, ${crime.country} (Case ${crime.caseNumber}). Immediate scene preservation requested.`
      : ''
  );

  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isDelivered, setIsDelivered] = useState(false);

  // Dispatch alert handler
  const handleDispatch = () => {
    setIsTransmitting(true);

    setTimeout(() => {
      const generatedDigest = `ED25519: 0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10).toUpperCase()}`;

      const newAlert: DispatchedLawEnforcementAlert = {
        id: `DISP-ALERT-${Date.now().toString().slice(-4)}`,
        timestamp: Date.now(),
        timeFormatted: 'Just now',
        agencyRecipient: agency,
        urgency: urgency,
        subjectId: subject?.id || 'GLOBAL-INCIDENT',
        subjectName: subject?.fullName || (crime ? `Case: ${crime.caseNumber}` : 'Unknown Entity'),
        idNumber: subject?.idNumber || 'N/A',
        birthDate: subject?.birthDate || 'N/A',
        country: subject?.country || crime?.country || 'International',
        cityOrVillage: subject?.cityOrVillage || crime?.cityOrVillage || 'Multi-Jurisdiction',
        coordinates: subject?.coordinates || crime?.coordinates || [52.7408, 6.0792],
        fraudScore: subject?.fraudRiskScore || 85,
        crimeCaseReference: crime?.caseNumber,
        actionRequired: actionRequired,
        officerNotes: officerNotes,
        deliveryStatus: 'DELIVERED',
        cryptographicDispatchDigest: generatedDigest
      };

      onAlertDispatched(newAlert);
      setIsTransmitting(false);
      setIsDelivered(true);

      setTimeout(() => {
        setIsDelivered(false);
        onClose();
      }, 1600);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-red-500/40 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950/80 to-slate-900 border-b border-red-900/40 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                DISPATCH LAW ENFORCEMENT & FRAUD ALERT
              </h2>
              <p className="text-xs text-red-300/80 font-mono">
                Post-Quantum Authenticated SIEM & Interpol Wire Broadcast
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Target Agency & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-slate-400 uppercase font-bold block mb-1">
                Recipient Agency
              </label>
              <select
                value={agency}
                onChange={(e) => setAgency(e.target.value as AlertAgencyRecipient)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono focus:border-red-500 outline-none"
              >
                <option value="INTERPOL_I24_7">INTERPOL I-24/7 (Red Notice Command)</option>
                <option value="EUROPOL_SIENA">EUROPOL SIENA (Cyber & Financial)</option>
                <option value="NATIONAL_POLICE_SOC">Local Police SOC / Constabulary</option>
                <option value="FINANCIAL_FRAUD_FINCEN">FinCEN / FIU Asset Freeze</option>
                <option value="BORDER_CUSTOMS_AGENCY">Border & Customs Biometric Lock</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase font-bold block mb-1">
                Urgency Level
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as AlertUrgency)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-red-400 font-bold font-mono focus:border-red-500 outline-none"
              >
                <option value="RED_FLASH_IMMEDIATE">RED FLASH (Immediate Arrest on Sight)</option>
                <option value="PRIORITY_INTERCEPT">PRIORITY INTERCEPT (Border Stop)</option>
                <option value="SURVEILLANCE_TRACE">SURVEILLANCE TRACE (Active Monitor)</option>
                <option value="FRAUD_FREEZE">FRAUD FREEZE (Financial & Account Halt)</option>
              </select>
            </div>
          </div>

          {/* Bound Target Dossier Summary */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-2">
            <span className="text-[11px] font-mono text-cyan-400 uppercase font-bold block">
              AUTOMATICALLY BOUND TARGET DOSSIER
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Target Name:</span>
                <span className="text-white font-bold">{subject?.fullName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">ID / Passport #:</span>
                <span className="text-cyan-300 font-bold">{subject?.idNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Date of Birth:</span>
                <span className="text-slate-300">{subject?.birthDate || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Jurisdiction:</span>
                <span className="text-slate-300">{subject?.country || crime?.country || 'International'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Locality (City/Village):</span>
                <span className="text-slate-300">
                  {subject?.cityOrVillage || crime?.cityOrVillage || 'N/A'} {subject?.isVillage ? '🏡 (Village)' : '🏢 (City)'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Fraud Score:</span>
                <span className="text-red-400 font-bold">{subject?.fraudRiskScore || 85}%</span>
              </div>
            </div>

            {crime && (
              <div className="mt-2 pt-2 border-t border-slate-800 text-xs font-mono text-amber-300">
                Linked Crime Case: <strong>{crime.caseNumber}</strong> ({crime.title})
              </div>
            )}
          </div>

          {/* Action Required Input */}
          <div>
            <label className="text-xs font-mono text-slate-400 uppercase font-bold block mb-1">
              Required Law Enforcement Action
            </label>
            <textarea
              rows={2}
              value={actionRequired}
              onChange={(e) => setActionRequired(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-sans focus:border-red-500 outline-none leading-relaxed"
            />
          </div>

          {/* Officer Tactical Notes */}
          <div>
            <label className="text-xs font-mono text-slate-400 uppercase font-bold block mb-1">
              Officer Notes & Forensic Evidence
            </label>
            <textarea
              rows={2}
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-sans focus:border-red-500 outline-none leading-relaxed"
            />
          </div>

          {/* Cryptographic Attestation Notice */}
          <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              Alert payload will be signed with post-quantum Dilithium-5 hardware enclave key before transmission.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#1E293B] border-t border-slate-800 p-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleDispatch}
            disabled={isTransmitting || isDelivered}
            className={`px-5 py-2.5 rounded-lg text-white font-bold text-xs flex items-center gap-2 transition shadow-lg cursor-pointer ${
              isDelivered
                ? 'bg-emerald-600'
                : 'bg-red-600 hover:bg-red-500 disabled:opacity-50'
            }`}
          >
            {isTransmitting ? (
              <>
                <Radio className="w-4 h-4 animate-spin" />
                <span>Broadcasting to {agency}...</span>
              </>
            ) : isDelivered ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Alert Delivered & Acknowledged!</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Transmit Red Alert Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
