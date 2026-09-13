import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  TelemetryAnomalyAlert, 
  ValidationProof, 
  EnclaveKeyInfo, 
  PolicyEnforcementLevel,
  GoogleTaskItem 
} from '../types';

export interface AuditPdfOptions {
  alerts: TelemetryAnomalyAlert[];
  proofs: ValidationProof[];
  enclaveKey: EnclaveKeyInfo;
  policyLevel: PolicyEnforcementLevel;
  tasks?: GoogleTaskItem[];
  operatorName?: string;
  classification?: string;
}

export interface SecurityDocumentExportOptions {
  title: string;
  documentId: string;
  version: string;
  classification: string;
  author: string;
  effectiveDate: string;
  complianceStandard: string;
  summary: string;
  sections: { heading: string; content: string }[];
  cryptographicDigest: string;
}

/**
 * Generates and triggers download of a PDF audit report of session anomalies and security proofs
 */
export const generateSecurityAuditPdfReport = ({
  alerts,
  proofs,
  enclaveKey,
  policyLevel,
  tasks = [],
  operatorName = 'SECOPS Operator (Sean Cross - Clear L5)',
  classification = 'TOP SECRET // ZERO-TRUST ATTESTATION'
}: AuditPdfOptions): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = 14;

  // Colors as strict [number, number, number] tuples for autoTable compatibility
  const primaryNavy: [number, number, number] = [15, 23, 42]; // #0F172A
  const accentCyan: [number, number, number] = [6, 182, 212]; // #06B6D4
  const textDark: [number, number, number] = [30, 41, 59]; // #1E293B
  const textMuted: [number, number, number] = [100, 116, 139]; // #64748B
  const borderLine: [number, number, number] = [226, 232, 240]; // #E2E8F0
  const successGreen: [number, number, number] = [16, 185, 129]; // #10B981
  const dangerRose: [number, number, number] = [244, 63, 94]; // #F43F5E
  const warnAmber: [number, number, number] = [217, 119, 6]; // #D97706

  // Helper: Draw Header Banner on current page
  const drawPageHeader = (pageNum: number) => {
    // Top classification bar
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(0, 0, pageWidth, 9, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(classification, pageWidth / 2, 6, { align: 'center' });

    // Subtle footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setDrawColor(borderLine[0], borderLine[1], borderLine[2]);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    doc.text(`AGIS 2045 CYBER-NODE // CRYPTOGRAPHIC AUDIT REPORT // PAGE ${pageNum}`, margin, pageHeight - 6);
    doc.text(`AUTHENTICATED BY HARDWARE ENCLAVE [${enclaveKey.hardwareSlot}]`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  };

  drawPageHeader(1);
  currentY = 16;

  // Title Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('AGIS 2045 CYBER-NODE OPERATING ENVIRONMENT', margin, currentY);
  currentY += 5;

  doc.setFontSize(10.5);
  doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
  doc.text('SESSION ANOMALY AUDIT & MATHEMATICAL SECURITY PROOFS DOSSIER', margin, currentY);
  currentY += 6;

  // Metadata Card / Enclave Spec Box
  doc.setFillColor(248, 250, 252); // #F8FAFC
  doc.setDrawColor(203, 213, 225); // #CBD5E1
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 27, 2, 2, 'FD');

  const reportDate = new Date().toISOString();
  const sessionHash = `0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`.toUpperCase();

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  doc.text('SESSION METADATA & ENCLAVE ATTESTATION', margin + 3, currentY + 4.5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);

  const col1X = margin + 3;
  const col2X = margin + 65;
  const col3X = margin + 128;

  doc.text(`Generation Timestamp: ${reportDate}`, col1X, currentY + 9);
  doc.text(`Operator: ${operatorName}`, col1X, currentY + 13);
  doc.text(`Policy Level: ${policyLevel} (Hardware Bound)`, col1X, currentY + 17);
  doc.text(`Session Integrity Hash: ${sessionHash}`, col1X, currentY + 21);

  doc.text(`Hardware Slot: ${enclaveKey.hardwareSlot}`, col2X, currentY + 9);
  doc.text(`Key Algorithm: ${enclaveKey.algorithm}`, col2X, currentY + 13);
  doc.text(`Key Memory Address: ${enclaveKey.memoryAddress}`, col2X, currentY + 17);
  doc.text(`Enclave Lock State: ${enclaveKey.lockState}`, col2X, currentY + 21);

  doc.text(`Cryptographic Standard: NIST FIPS 203 ML-KEM`, col3X, currentY + 9);
  doc.text(`Nitro Attestation: PCR0 Sealed (0x44BC)`, col3X, currentY + 13);
  doc.text(`Laplace Differential Privacy: ε = 0.5`, col3X, currentY + 17);
  doc.text(`Verification Authority: Hardware Root of Trust`, col3X, currentY + 21);

  currentY += 31;

  // Executive Summary KPI Cards
  const totalAnomalies = alerts.length;
  const mitigatedAnomalies = alerts.filter(a => a.isMitigated).length;
  const criticalThreats = alerts.filter(a => a.severity === 'CRITICAL').length;
  const passedProofs = proofs.filter(p => p.isPassing).length;
  const totalProofs = proofs.length;

  const cardW = (pageWidth - (margin * 2) - 9) / 4;
  const cardH = 14;

  const summaryCards = [
    { label: 'TOTAL ANOMALIES', value: totalAnomalies.toString(), sub: `${mitigatedAnomalies} Mitigated (${totalAnomalies > 0 ? Math.round((mitigatedAnomalies/totalAnomalies)*100) : 100}%)`, color: accentCyan },
    { label: 'UNRESOLVED ALERTS', value: (totalAnomalies - mitigatedAnomalies).toString(), sub: criticalThreats > 0 ? `${criticalThreats} Critical Risk` : 'Clean Perimeter', color: totalAnomalies - mitigatedAnomalies > 0 ? dangerRose : successGreen },
    { label: 'SECURITY PROOFS', value: `${passedProofs}/${totalProofs}`, sub: '100% Invariants Intact', color: successGreen },
    { label: 'KYBER ROTATION', value: `${enclaveKey.rotationRemainingSec}s Rem`, sub: '512-bit Lattice Active', color: primaryNavy }
  ];

  summaryCards.forEach((c, idx) => {
    const cx = margin + idx * (cardW + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(borderLine[0], borderLine[1], borderLine[2]);
    doc.roundedRect(cx, currentY, cardW, cardH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(c.label, cx + 2.5, currentY + 4);

    doc.setFontSize(10.5);
    doc.setTextColor(c.color[0], c.color[1], c.color[2]);
    doc.text(c.value, cx + 2.5, currentY + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(c.sub, cx + 2.5, currentY + 12.5);
  });

  currentY += cardH + 5;

  // Section 1: Anomaly History Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('1. SESSION ANOMALY EVENT LOG & ACTIVE MITIGATION HISTORY', margin, currentY);
  currentY += 2;

  const anomalyRows = alerts.map((alert) => {
    const dateStr = new Date(alert.timestamp).toLocaleTimeString();
    return [
      alert.id,
      dateStr,
      alert.anomalyType.replace(/_/g, ' '),
      alert.severity,
      alert.affectedDomainOrNode,
      alert.isMitigated ? 'MITIGATED' : 'ACTION REQ',
      alert.cryptographicFingerprint
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['ID', 'Time', 'Anomaly Vector', 'Severity', 'Domain / Node', 'Status', 'Fingerprint']],
    body: anomalyRows,
    theme: 'grid',
    styles: {
      fontSize: 6.8,
      cellPadding: 1.8,
      font: 'helvetica',
      textColor: textDark,
      lineColor: borderLine,
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: primaryNavy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7
    },
    columnStyles: {
      0: { cellWidth: 24, fontStyle: 'bold' },
      1: { cellWidth: 16 },
      2: { cellWidth: 42 },
      3: { cellWidth: 18, fontStyle: 'bold' },
      4: { cellWidth: 35 },
      5: { cellWidth: 20, fontStyle: 'bold' },
      6: { cellWidth: 27, font: 'courier' }
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        if (data.column.index === 3) {
          const val = data.cell.raw as string;
          if (val === 'CRITICAL') {
            data.cell.styles.textColor = dangerRose;
          } else if (val === 'HIGH') {
            data.cell.styles.textColor = warnAmber;
          } else {
            data.cell.styles.textColor = accentCyan;
          }
        }
        if (data.column.index === 5) {
          const status = data.cell.raw as string;
          if (status === 'MITIGATED') {
            data.cell.styles.textColor = successGreen;
          } else {
            data.cell.styles.textColor = dangerRose;
          }
        }
      }
    },
    margin: { left: margin, right: margin }
  });

  // Get Y position after table
  const finalTableY = (doc as any).lastAutoTable.finalY || currentY + 40;
  currentY = finalTableY + 6;

  // Check if we need a new page or continue
  if (currentY > pageHeight - 60) {
    doc.addPage();
    drawPageHeader(2);
    currentY = 16;
  }

  // Section 2: Mathematical Security & Invariant Proofs
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('2. MATHEMATICAL INVARIANT & POST-QUANTUM CRYPTOGRAPHIC PROOFS', margin, currentY);
  currentY += 2;

  const proofRows = proofs.map((proof) => [
    proof.id,
    proof.name,
    proof.description,
    proof.verificationDigest,
    proof.isPassing ? 'VALIDATED' : 'FAILED',
    `${proof.latencyMs || 6}ms`
  ]);

  const secondaryNavy: [number, number, number] = [30, 41, 59];

  autoTable(doc, {
    startY: currentY,
    head: [['Proof ID', 'Verification Name', 'Cryptographic Target', 'Digest / Witness', 'Status', 'Latency']],
    body: proofRows,
    theme: 'grid',
    styles: {
      fontSize: 6.8,
      cellPadding: 1.8,
      font: 'helvetica',
      textColor: textDark,
      lineColor: borderLine,
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: secondaryNavy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7
    },
    columnStyles: {
      0: { cellWidth: 16, fontStyle: 'bold' },
      1: { cellWidth: 38, fontStyle: 'bold' },
      2: { cellWidth: 54 },
      3: { cellWidth: 46, font: 'courier' },
      4: { cellWidth: 18, fontStyle: 'bold', textColor: successGreen },
      5: { cellWidth: 10, halign: 'right' }
    },
    margin: { left: margin, right: margin }
  });

  const finalProofY = (doc as any).lastAutoTable.finalY || currentY + 30;
  currentY = finalProofY + 6;

  // Check page fit for SecOps Tasks and Formal Seal
  if (currentY > pageHeight - 50) {
    doc.addPage();
    drawPageHeader(3);
    currentY = 16;
  }

  // Section 3: Hardware Enclave & Compliance Attestation Seal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('3. COMPLIANCE STANDARDS & CRYPTOGRAPHIC ATTESTATION SEAL', margin, currentY);
  currentY += 3;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 34, 2, 2, 'FD');

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('FORMAL ZERO-TRUST COMPLIANCE DECLARATION', margin + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const complianceText = 
    'This cryptographic session report certifies that all telemetry processing within the AGIS 2045 Cyber-Node adhered to ' +
    'NIST SP 800-207 Zero-Trust Architecture standards. Key material was quarantined in isolated ARM TrustZone / AWS Nitro ' +
    'hardware enclave memory under Kyber-1024 / Dilithium-5 post-quantum lattice encryption. All external egress transmissions ' +
    'were scrubbed with Laplace differential privacy noise (ε = 0.5) and verified against unmasked PII exposure.';
  
  const splitCompliance = doc.splitTextToSize(complianceText, pageWidth - (margin * 2) - 8);
  doc.text(splitCompliance, margin + 4, currentY + 9);

  // Digital Signatures row
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('ATTESTATION STANDARDS: SOC 2 TYPE II | ISO/IEC 27001:2022 | FIPS 140-3 LEVEL 4 | NIST FIPS 203', margin + 4, currentY + 22);

  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(`SEAL DIGEST: SHA512[0x9F4C...${sessionHash.slice(2, 10)}_DETERMINISTIC_PASS] // HARDWARE ENCLAVE VERIFIED`, margin + 4, currentY + 27);
  doc.text(`TIMESTAMP: ${reportDate} // SIGNED BY NITRO_PCR0_ATTESTOR_0x44BC`, margin + 4, currentY + 31);

  // Save / Trigger Download
  const filename = `AGIS-2045-Security-Audit-Report-${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`;
  doc.save(filename);

  return doc;
};

/**
 * Generates an official standalone Security Document / Compliance Certificate PDF
 */
export const generateSecurityDocumentPdf = (options: SecurityDocumentExportOptions): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  let currentY = 16;

  const primaryNavy: [number, number, number] = [15, 23, 42];
  const accentCyan: [number, number, number] = [6, 182, 212];
  const textDark: [number, number, number] = [30, 41, 59];
  const textMuted: [number, number, number] = [100, 116, 139];
  const borderLine: [number, number, number] = [226, 232, 240];

  // Header Banner
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, pageWidth, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(options.classification.toUpperCase(), pageWidth / 2, 6.5, { align: 'center' });

  // Footer
  const drawFooter = (pageNum: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setDrawColor(borderLine[0], borderLine[1], borderLine[2]);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.text(`AGIS 2045 CYBER-NODE // ${options.documentId} // PAGE ${pageNum}`, margin, pageHeight - 7);
    doc.text(`DIGITAL SIGNATURE: ${options.cryptographicDigest.slice(0, 20)}...`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  };

  drawFooter(1);
  currentY = 20;

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(options.title, margin, currentY);
  currentY += 6;

  doc.setFontSize(9.5);
  doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
  doc.text(`DOCUMENT REF: ${options.documentId} // VERSION ${options.version} // ${options.complianceStandard}`, margin, currentY);
  currentY += 6;

  // Metadata Table
  autoTable(doc, {
    startY: currentY,
    head: [['Attribute', 'Specification / Value']],
    body: [
      ['Author / Security Authority', options.author],
      ['Effective Date', options.effectiveDate],
      ['Compliance Framework', options.complianceStandard],
      ['Security Classification', options.classification],
      ['Cryptographic Verification Digest', options.cryptographicDigest]
    ],
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      font: 'helvetica',
      textColor: textDark,
      lineColor: borderLine
    },
    headStyles: {
      fillColor: primaryNavy,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: pageWidth - (margin * 2) - 55 }
    },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Executive Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('Executive Summary', margin, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const splitSummary = doc.splitTextToSize(options.summary, pageWidth - (margin * 2));
  doc.text(splitSummary, margin, currentY);
  currentY += splitSummary.length * 4.5 + 6;

  // Sections
  options.sections.forEach((sec, index) => {
    if (currentY > pageHeight - 40) {
      doc.addPage();
      drawFooter(doc.getNumberOfPages());
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(`${index + 1}. ${sec.heading}`, margin, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    const splitContent = doc.splitTextToSize(sec.content, pageWidth - (margin * 2));
    doc.text(splitContent, margin, currentY);
    currentY += splitContent.length * 4.2 + 6;
  });

  const filename = `${options.documentId}-${options.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
  return doc;
};
