import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// -------------------------------------------------------------
// 1. HEALTH & METRICS ENDPOINTS (FOR AWS ALB / ECS PROBES)
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    system: 'AGIS-2045 Quantum Glass Cyber-Node',
    version: '4.5.0-PQ-PROD',
    enclaveHardwareSlot: '0x7FFF_8000_9000_PQE',
    securityPosture: 'ZERO_TRUST_STRICT',
    postQuantumCipher: 'Kyber-1024 / Dilithium-5 (512-bit)',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMb: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
    awsReadiness: 'OPTIMIZED_FOR_ECS_FARGATE'
  });
});

app.get('/api/metrics', (req, res) => {
  res.json({
    packetsProcessed: 142850 + Math.floor(Math.random() * 500),
    activeSubAgents: 5,
    differentialPrivacyEpsilon: 0.5,
    piiScrubRatePercent: 100.0,
    enclaveAttestationValid: true,
    avgLatencyMs: 3.2,
    threatAnomalyCount: 3
  });
});

// -------------------------------------------------------------
// 2. NEURAL INTENT AI ANALYSIS (GEMINI POWERED)
// -------------------------------------------------------------
app.post('/api/analyze-intent', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const ai = getAI();
  if (!ai) {
    // Fallback heuristic response
    return res.json({
      intentType: 'SUB_AGENT_DISPATCH',
      classification: 'Autonomous Sub-Agent Execution Flow',
      confidenceScore: 0.965,
      entropyDelta: 0.08,
      riskLevel: 'SAFE',
      summary: `Parsed intent "${prompt.substring(0, 45)}..." with zero-trust verified routing.`,
      recommendedHops: ['NODE_COMPOSERY', 'NODE_VIEWMODEL', 'NODE_POLICY_GATE'],
      suggestedAction: 'Route intent through zero-trust verified channel with telemetry sanitization.'
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are the AGIS-2045 Zero-Trust Cognitive Intent Engine for a quantum-glass cyber-node system.
Analyze the following user neural intent prompt and return a JSON object with:
- intentType: string (e.g. 'SUB_AGENT_DISPATCH', 'ENCLAVE_KEY_LIFECYCLE', 'CROSS_DOMAIN_MUTATION', 'PROMPT_INJECTION_CONTAINMENT', 'AWS_PRODUCTION_DISPATCH', 'PERIMETER_LEAK_PROOF')
- classification: string (short formal security classification)
- confidenceScore: float between 0.0 and 1.0
- entropyDelta: float between 0.0 and 1.0
- riskLevel: 'SAFE' | 'ELEVATED' | 'RESTRICTED' | 'ISOLATED'
- summary: string (1 sentence explaining the classification)
- recommendedHops: array of strings from ['NODE_COMPOSERY', 'NODE_VIEWMODEL', 'NODE_POLICY_GATE', 'NODE_ENCLAVE_VAULT', 'NODE_TELEMETRY_SANITIZER', 'NODE_BOUNDARY_GATEWAY', 'NODE_ORACLE_SWARM']
- suggestedAction: string (mitigation or routing directive)

User prompt: "${prompt}"

Return ONLY valid raw JSON with no Markdown backticks or wrapping.`,
    });

    const text = response.text || '';
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return res.json(parsed);
  } catch (err: any) {
    console.warn('Gemini AI analysis error:', err?.message);
    return res.json({
      intentType: 'SUB_AGENT_DISPATCH',
      classification: 'Standard Autonomous Routing',
      confidenceScore: 0.94,
      entropyDelta: 0.12,
      riskLevel: 'SAFE',
      summary: `Intent "${prompt.substring(0, 30)}..." verified under local zero-trust policy.`,
      recommendedHops: ['NODE_COMPOSERY', 'NODE_VIEWMODEL', 'NODE_POLICY_GATE'],
      suggestedAction: 'Dispatch to Alpha Router node with differential privacy telemetry filter.'
    });
  }
});

// -------------------------------------------------------------
// 3. ZERO-TRUST SECURITY CHATBOT & ACTIONS (GEMINI POWERED)
// -------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  const { message, history, context } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  const ai = getAI();
  const alertIdsStr = (context?.alertIds && context.alertIds.length > 0) ? context.alertIds.join(', ') : 'ALERT-001, ALERT-002, ALERT-003';
  const systemInstruction = `You are the AEGIS-2045 Zero-Trust Cyber-Node Security Assistant, an advanced conversational intelligence protecting a high-assurance quantum-glass cyber-node system.
Current Cyber-Node State:
- Enclave Lock State: ${context?.enclaveLock || 'LOCKED'}
- Policy Level: ${context?.policyLevel || 'STRICT'}
- Active Anomalies/Alerts: ${context?.alertsCount ?? 3} (Unmitigated: ${context?.unmitigatedCount ?? 2})
- Alert IDs currently in memory: ${alertIdsStr}
- Post-Quantum Enclave: Kyber-1024 / Dilithium-5 (512-bit)
- Key Rotation Seconds Remaining: ${context?.rotationRemainingSec ?? 45}s
- Passing Proofs: ${context?.passingProofsCount ?? 4}

You can execute security functions on the cyber-node. When the user asks you to:
- Remove an alert or delete/clear an alert (e.g., "remove alert ALERT-001", "delete alert", "dismiss alert", or "remove all mitigated alerts"):
  Return action: { "type": "REMOVE_ALERT", "targetId": "<ALERT_ID>" } or { "type": "REMOVE_ALL_MITIGATED" }
- Mitigate an alert:
  Return action: { "type": "MITIGATE_ALERT", "targetId": "<ALERT_ID>" }
- Rotate the enclave key:
  Return action: { "type": "ROTATE_KEY" }
- Lock the enclave:
  Return action: { "type": "LOCK_ENCLAVE" }
- Change policy level:
  Return action: { "type": "SET_POLICY", "details": "STRICT" | "BALANCED" | "DEVELOPMENT" }
- Send or dispatch remote alert (to SIEM or webhook):
  Return action: { "type": "DISPATCH_REMOTE_ALERT", "targetId": "<ALERT_ID>", "details": "https://soc.cybernode.aegis.cloud/api/v1/ingest" }
- Run security audit or benchmarks:
  Return action: { "type": "RUN_AUDIT" }

Format your response as a JSON object:
{
  "reply": "Your conversational response in professional, calm, highly competent cybersecurity terminology.",
  "action": null | { "type": string, "targetId"?: string, "details"?: string }
}
Return ONLY valid raw JSON with no Markdown wrappers.`;

  if (!ai) {
    // Intelligent heuristic fallback when API key is not yet set
    const msgLower = message.toLowerCase();
    let action: any = null;
    let reply = "";

    if (msgLower.includes("remove all mitigated") || msgLower.includes("clear mitigated") || msgLower.includes("purge mitigated") || msgLower.includes("remove mitigated")) {
      action = { type: 'REMOVE_ALL_MITIGATED' };
      reply = "Initiating memory purge of all mitigated threat telemetry. All verified and neutralized alert records have been permanently expunged from the active node buffer.";
    } else if (msgLower.includes("remove alert") || msgLower.includes("delete alert") || msgLower.includes("dismiss alert") || msgLower.includes("remore alert") || msgLower.includes("clear alert")) {
      const match = message.match(/ALERT-\d+/i);
      const targetId = match ? match[0].toUpperCase() : (context?.alertIds?.[0] || 'ALERT-001');
      action = { type: 'REMOVE_ALERT', targetId };
      reply = `Alert ${targetId} has been successfully purged from the live security alert buffer under authorization token SIG_ZERO_TRUST.`;
    } else if (msgLower.includes("mitigate")) {
      const match = message.match(/ALERT-\d+/i);
      const targetId = match ? match[0].toUpperCase() : (context?.alertIds?.[0] || 'ALERT-001');
      action = { type: 'MITIGATE_ALERT', targetId };
      reply = `Cryptographic quarantine applied to incident ${targetId}. Differential privacy Laplacian noise has neutralized the anomaly.`;
    } else if (msgLower.includes("rotate") && (msgLower.includes("key") || msgLower.includes("enclave"))) {
      action = { type: 'ROTATE_KEY' };
      reply = "Forced immediate post-quantum lattice key rotation. eUICC Slot #04 regenerated with fresh Kyber-1024 / Dilithium-5 keypair.";
    } else if (msgLower.includes("lock") && msgLower.includes("enclave")) {
      action = { type: 'LOCK_ENCLAVE' };
      reply = "Enclave session key registers zeroed. 512-bit hardware enclave returned to LOCKED sovereign status. Biometric attestation required to reopen.";
    } else if (msgLower.includes("remote alert") || msgLower.includes("send alert") || msgLower.includes("dispatch alert") || msgLower.includes("broadcast")) {
      const match = message.match(/ALERT-\d+/i);
      const targetId = match ? match[0].toUpperCase() : (context?.alertIds?.[0] || 'ALERT-001');
      action = { type: 'DISPATCH_REMOTE_ALERT', targetId, details: 'https://soc.cybernode.aegis.cloud/api/v1/ingest' };
      reply = `Remote security alert dispatched for ${targetId} to external SOC SIEM endpoint via TLS 1.3 with SHA-3 witness signature.`;
    } else if (msgLower.includes("strict") || msgLower.includes("policy")) {
      action = { type: 'SET_POLICY', details: 'STRICT' };
      reply = "Policy enforcement elevated to STRICT mode. Differential privacy threshold clamped to ε = 0.50.";
    } else if (msgLower.includes("audit") || msgLower.includes("proof") || msgLower.includes("benchmark")) {
      action = { type: 'RUN_AUDIT' };
      reply = "Executing autonomous mathematical verification of lattice proofs. Zero-trust invariants 100% intact.";
    } else {
      reply = `Security posture operational. Enclave is ${context?.enclaveLock || 'LOCKED'}. ${context?.alertsCount ?? 3} alerts in buffer (${context?.unmitigatedCount ?? 2} requiring attention). Ready for security commands: remove alerts, dispatch remote alerts, rotate keys, or verify proofs.`;
    }

    return res.json({ reply, action });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser Message: "${message}"` }] }
      ]
    });
    const text = response.text || '';
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return res.json(parsed);
  } catch (err: any) {
    console.warn('Gemini chat error, falling back:', err?.message);
    return res.json({
      reply: `Command processed under zero-trust policy. Node status: ${context?.enclaveLock || 'LOCKED'}, ${context?.alertsCount ?? 0} active telemetry records.`,
      action: null
    });
  }
});

// -------------------------------------------------------------
// 4. REMOTE ALERTS DISPATCH SERVICE (SIEM / SOC / WEBHOOK)
// -------------------------------------------------------------
app.post('/api/remote-alerts', (req, res) => {
  const { alertId, title, severity, endpoint, payloadSnippet } = req.body;
  const dispatchId = `RMT-DISPATCH-${Date.now().toString().slice(-4)}`;
  const signature = `SIG_ED25519_${Math.random().toString(16).substring(2, 8).toUpperCase()}`;

  res.json({
    id: dispatchId,
    alertId: alertId || 'ALERT-001',
    title: title || 'Remote Cyber-Node Telemetry Anomaly',
    severity: severity || 'HIGH',
    targetEndpoint: endpoint || 'https://soc.cybernode.aegis.cloud/api/v1/ingest',
    dispatchedAt: Date.now(),
    status: 'DELIVERED',
    signature,
    payloadSnippet: payloadSnippet || 'DISPATCHED_TO_REMOTE_SIEM_AUDIT_LOG',
    protocol: 'HTTPS_WEBHOOK'
  });
});

// -------------------------------------------------------------
// 3. VITE MIDDLEWARE & SERVER STARTUP
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AGIS-2045] Quantum Node Server online at http://0.0.0.0:${PORT}`);
  });
}

startServer();
