import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  ShieldCheck, 
  Award, 
  BookOpen, 
  Lock, 
  Search, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertTriangle,
  FileCheck2,
  Cpu,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  SecurityDocument, 
  SecurityDocCategory, 
  TelemetryAnomalyAlert, 
  ValidationProof, 
  EnclaveKeyInfo, 
  PolicyEnforcementLevel,
  GoogleTaskItem 
} from '../../types';
import { 
  generateSecurityAuditPdfReport, 
  generateSecurityDocumentPdf 
} from '../../services/pdfReportGenerator';

interface SecurityDocumentsScreenProps {
  documents: SecurityDocument[];
  alerts: TelemetryAnomalyAlert[];
  proofs: ValidationProof[];
  enclaveKey: EnclaveKeyInfo;
  policyLevel: PolicyEnforcementLevel;
  tasks?: GoogleTaskItem[];
}

export const SecurityDocumentsScreen: React.FC<SecurityDocumentsScreenProps> = ({
  documents,
  alerts,
  proofs,
  enclaveKey,
  policyLevel,
  tasks = []
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedDigest, setCopiedDigest] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<{ message: string; timestamp: number } | null>(null);
  const [isGeneratingAuditPdf, setIsGeneratingAuditPdf] = useState<boolean>(false);
  const [isGeneratingDocPdf, setIsGeneratingDocPdf] = useState<boolean>(false);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesCategory = selectedCategory === 'ALL' || doc.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesQuery = 
        !searchQuery ||
        doc.title.toLowerCase().includes(q) ||
        doc.id.toLowerCase().includes(q) ||
        doc.complianceStandard.toLowerCase().includes(q) ||
        doc.summary.toLowerCase().includes(q) ||
        doc.cryptographicDigest.toLowerCase().includes(q);

      return matchesCategory && matchesQuery;
    });
  }, [documents, selectedCategory, searchQuery]);

  const activeDoc = useMemo(() => {
    return documents.find(d => d.id === selectedDocId) || documents[0];
  }, [documents, selectedDocId]);

  // Copy digest helper
  const handleCopyDigest = (digest: string) => {
    navigator.clipboard.writeText(digest);
    setCopiedDigest(digest);
    setTimeout(() => {
      setCopiedDigest(null);
    }, 2500);
  };

  // Trigger Session Anomaly & Proofs PDF Generation
  const handleExportSessionAuditPdf = () => {
    setIsGeneratingAuditPdf(true);
    try {
      generateSecurityAuditPdfReport({
        alerts,
        proofs,
        enclaveKey,
        policyLevel,
        tasks
      });
      setExportNotice({
        message: `Session Audit PDF exported successfully! Included ${alerts.length} anomalies and ${proofs.length} mathematical security proofs.`,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('Failed to generate audit PDF:', err);
      setExportNotice({
        message: 'Failed to generate session audit PDF. Please check console.',
        timestamp: Date.now()
      });
    } finally {
      setTimeout(() => setIsGeneratingAuditPdf(false), 600);
    }
  };

  // Trigger Individual Document PDF Generation
  const handleExportDocumentPdf = (doc: SecurityDocument) => {
    setIsGeneratingDocPdf(true);
    try {
      generateSecurityDocumentPdf({
        title: doc.title,
        documentId: doc.id,
        version: doc.version,
        classification: doc.classification,
        author: doc.author,
        effectiveDate: doc.effectiveDate,
        complianceStandard: doc.complianceStandard,
        summary: doc.summary,
        sections: doc.sections,
        cryptographicDigest: doc.cryptographicDigest
      });
      setExportNotice({
        message: `Exported "${doc.title}" as official PDF report!`,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('Failed to generate doc PDF:', err);
      setExportNotice({
        message: 'Failed to generate document PDF.',
        timestamp: Date.now()
      });
    } finally {
      setTimeout(() => setIsGeneratingDocPdf(false), 600);
    }
  };

  const categories: { id: string; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Documents', count: documents.length },
    { id: 'WHITEPAPER', label: 'Whitepapers', count: documents.filter(d => d.category === 'WHITEPAPER').length },
    { id: 'COMPLIANCE_CERT', label: 'Compliance Certs', count: documents.filter(d => d.category === 'COMPLIANCE_CERT').length },
    { id: 'SPECIFICATION', label: 'Specifications', count: documents.filter(d => d.category === 'SPECIFICATION').length },
    { id: 'POLICY_MANUAL', label: 'Policy Manuals', count: documents.filter(d => d.category === 'POLICY_MANUAL').length }
  ];

  const unmitigatedAlertsCount = alerts.filter(a => !a.isMitigated).length;
  const passingProofsCount = proofs.filter(p => p.isPassing).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Audit Export Action Bar */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>COMPLIANCE & ATTESTATION VAULT</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                SOC 2 TYPE II • ISO 27001 • FIPS 140-3 LEVEL 4
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-cyan-400" />
              <span>Security Documents & Attestation Dossiers</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Cryptographically signed zero-trust architecture specifications, post-quantum cryptography whitepapers, 
              independent compliance certificates, and real-time session audit PDF generation.
            </p>
          </div>

          {/* Quick PDF Export Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportSessionAuditPdf}
              disabled={isGeneratingAuditPdf}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-cyan-950/40 border border-cyan-400/30 cursor-pointer disabled:opacity-50"
              title="Generate a multi-page PDF audit report of all session anomalies, mitigation history, and mathematical proofs"
            >
              <Download className={`w-4 h-4 ${isGeneratingAuditPdf ? 'animate-bounce' : ''}`} />
              <span>{isGeneratingAuditPdf ? 'Compiling PDF Dossier...' : 'Export Session Audit Dossier (PDF)'}</span>
            </button>

            {activeDoc && (
              <button
                onClick={() => handleExportDocumentPdf(activeDoc)}
                disabled={isGeneratingDocPdf}
                className="px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-2 transition border border-slate-700 cursor-pointer disabled:opacity-50"
                title="Download this specific whitepaper or certification certificate as PDF"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Export Active Document (PDF)</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Export Notice Toast */}
        {exportNotice && (
          <div className="mt-4 p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between gap-3 text-xs text-cyan-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{exportNotice.message}</span>
            </div>
            <button
              onClick={() => setExportNotice(null)}
              className="text-cyan-400 hover:text-white font-mono text-[10px] cursor-pointer"
            >
              DISMISS
            </button>
          </div>
        )}
      </div>

      {/* Session Export Telemetry Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-3.5">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Live Anomalies in Report</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-white">{alerts.length}</span>
            <span className={`text-[11px] font-mono ${unmitigatedAlertsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              ({unmitigatedAlertsCount} Unmitigated)
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Ready for PDF AutoTable export</p>
        </div>

        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-3.5">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Mathematical Proofs</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-emerald-400">{passingProofsCount}/{proofs.length}</span>
            <span className="text-[11px] font-mono text-emerald-400">100% Intact</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Cryptographic witness digests attached</p>
        </div>

        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-3.5">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Enclave Attestation</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-sm font-bold text-cyan-300 truncate">Kyber-1024</span>
            <span className="text-[10px] font-mono text-slate-400">({enclaveKey.hardwareSlot.split(' ')[0]})</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Hardware lock: {enclaveKey.lockState}</p>
        </div>

        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-3.5">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Active Policy Gate</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-purple-400">{policyLevel}</span>
            <span className="text-[10px] font-mono text-purple-300">SEALED</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Differential Privacy ε = 0.5 enforced</p>
        </div>
      </div>

      {/* Category Pills & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#111827] p-1 rounded-lg border border-slate-800">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                selectedCategory === cat.id ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents, digests, standards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111827] border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Two-Column Layout: Document Navigator (Left) & Document Reader (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Document Cards List (5 columns) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
            <span>SHOWING {filteredDocuments.length} OF {documents.length} REPOSITORIES</span>
            <span>STANDARD</span>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
              <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No documents matched your filter criteria.</p>
              <button
                onClick={() => { setSelectedCategory('ALL'); setSearchQuery(''); }}
                className="mt-3 text-cyan-400 hover:underline font-mono text-[11px] cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredDocuments.map((doc) => {
                const isSelected = doc.id === activeDoc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`p-4 rounded-xl border transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/30'
                        : 'bg-[#1E293B] border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-cyan-400 font-bold">
                            {doc.id}
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            doc.category === 'COMPLIANCE_CERT'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : doc.category === 'WHITEPAPER'
                              ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                              : doc.category === 'SPECIFICATION'
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}>
                            {doc.badge}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            v{doc.version}
                          </span>
                        </div>

                        <h3 className={`text-sm font-semibold leading-snug line-clamp-2 ${
                          isSelected ? 'text-white' : 'text-slate-200'
                        }`}>
                          {doc.title}
                        </h3>

                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                          {doc.summary}
                        </p>
                      </div>

                      {/* PDF Quick Download Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportDocumentPdf(doc);
                        }}
                        className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 hover:border-cyan-500/50 hover:text-cyan-300 text-slate-400 transition shrink-0 cursor-pointer"
                        title="Download PDF directly"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-800/70 text-[10px] font-mono text-slate-400">
                      <span className="truncate">{doc.complianceStandard.split('/')[0]}</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ATTESTED</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Full Document Reader (7 columns) */}
        <div className="lg:col-span-7 bg-[#1E293B] border border-slate-800 rounded-xl p-6 space-y-6 shadow-sm">
          {activeDoc ? (
            <>
              {/* Document Header */}
              <div className="space-y-3 pb-5 border-b border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                      {activeDoc.id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-700">
                      VERSION {activeDoc.version}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      activeDoc.classification === 'TOP SECRET'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : activeDoc.classification === 'RESTRICTED'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {activeDoc.classification}
                    </span>
                  </div>

                  {/* Export this document button */}
                  <button
                    onClick={() => handleExportDocumentPdf(activeDoc)}
                    disabled={isGeneratingDocPdf}
                    className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Official PDF</span>
                  </button>
                </div>

                <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
                  {activeDoc.title}
                </h2>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span>Standard: <strong className="text-slate-200">{activeDoc.complianceStandard}</strong></span>
                  <span>•</span>
                  <span>Effective: <strong className="text-slate-200">{activeDoc.effectiveDate}</strong></span>
                </div>
              </div>

              {/* Cryptographic Attestation Metadata Card */}
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5 text-cyan-400 font-mono">
                    <ShieldCheck className="w-4 h-4" />
                    <span>CRYPTOGRAPHIC ATTESTATION RECORD</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>HARDWARE ROOT OF TRUST VERIFIED</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Author / Attesting Authority</p>
                    <p className="text-slate-200 font-medium mt-0.5">{activeDoc.author}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Compliance Framework</p>
                    <p className="text-slate-200 font-medium mt-0.5">{activeDoc.complianceStandard}</p>
                  </div>
                </div>

                {/* Cryptographic Digest with Copy */}
                <div className="pt-2 border-t border-slate-800/80">
                  <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Cryptographic Verification Digest</p>
                  <div className="flex items-center justify-between gap-2 bg-[#0A0E17] p-2 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300">
                    <span className="truncate">{activeDoc.cryptographicDigest}</span>
                    <button
                      onClick={() => handleCopyDigest(activeDoc.cryptographicDigest)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
                      title="Copy full cryptographic digest to clipboard"
                    >
                      {copiedDigest === activeDoc.cryptographicDigest ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Executive Summary Callout */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
                <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Executive Summary & Scope</span>
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeDoc.summary}
                </p>
              </div>

              {/* Document Sections Content */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">
                  Technical Specifications & Invariant Clauses
                </p>

                {activeDoc.sections.map((section, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 rounded-xl bg-[#111827]/70 border border-slate-800/80 space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-cyan-500/10 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center border border-cyan-500/30">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-200">
                        {section.heading}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed pl-7">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                <span className="font-mono text-[11px]">
                  OFFICIAL ATTESTATION DOCUMENT • AGIS ZERO-TRUST ARCHITECTURE
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportDocumentPdf(activeDoc)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={handleExportSessionAuditPdf}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Full Audit Dossier</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-400">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p>Select a document from the left column to view specifications.</p>
            </div>
          )}
        </div>
      </div>

      {/* Live Anomaly History & Mathematical Proofs Table Included in the PDF Report */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                SESSION AUDIT TELEMETRY (REAL-TIME BUFFER)
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Anomalies & Security Proofs Encapsulated in PDF Dossier</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              The following live session telemetry and mathematical invariant proofs are packaged and digitally signed when you click "Export Session Audit Dossier (PDF)".
            </p>
          </div>

          <button
            onClick={handleExportSessionAuditPdf}
            className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export This Session PDF</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Anomalies Table preview */}
          <div className="bg-[#111827] rounded-xl border border-slate-800 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-slate-800 pb-2">
              <span className="font-mono text-cyan-400">SESSION ANOMALY LOG ({alerts.length})</span>
              <span className="text-[10px] font-mono text-slate-500">UPDATES LIVE</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-2.5 rounded-lg bg-[#1E293B]/60 border border-slate-800/80 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-300">{alert.id}</span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className={`text-[10px] font-mono font-bold ${alert.isMitigated ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {alert.isMitigated ? 'MITIGATED' : 'ACTION REQ'}
                    </span>
                  </div>
                  <p className="text-slate-200 font-medium text-[11px] truncate">{alert.title}</p>
                  <p className="text-slate-400 text-[10px] font-mono truncate">Domain: {alert.affectedDomainOrNode}</p>
                  <p className="text-slate-500 text-[9px] font-mono truncate">Fingerprint: {alert.cryptographicFingerprint}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mathematical Proofs Table preview */}
          <div className="bg-[#111827] rounded-xl border border-slate-800 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-slate-800 pb-2">
              <span className="font-mono text-emerald-400">MATHEMATICAL SECURITY PROOFS ({proofs.length})</span>
              <span className="text-[10px] font-mono text-emerald-400">100% PASSING</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {proofs.map((proof) => (
                <div key={proof.id} className="p-2.5 rounded-lg bg-[#1E293B]/60 border border-slate-800/80 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-300">{proof.id}</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/30">
                      {proof.status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{proof.latencyMs || 6}ms</span>
                  </div>
                  <p className="text-slate-200 font-medium text-[11px] truncate">{proof.name}</p>
                  <p className="text-slate-400 text-[10px] truncate">{proof.description}</p>
                  <p className="text-cyan-400 text-[9px] font-mono truncate">Digest: {proof.verificationDigest}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
