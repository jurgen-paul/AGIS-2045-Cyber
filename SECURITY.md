# Security Policy & Vulnerability Reporting Process

## Supported Versions

We release security updates and patch releases for the following versions:

| Version | Supported          | Security Maintenance Status |
| ------- | ------------------ | --------------------------- |
| 2.4.x   | :white_check_mark: | Active (Current Baseline)   |
| 2.3.x   | :white_check_mark: | Critical patches only       |
| < 2.3.0 | :x:                | End of Life (EOL)           |

---

## 1. Vulnerability Reporting Process (Coordinated Disclosure)

We take the security of AEGIS 2045 seriously. If you identify a security vulnerability or potential threat in any part of this project, **please do not open a public issue.**

Instead, report it through our Coordinated Vulnerability Disclosure (CVD) process:

- **Primary Security Contact:** `security@aegis-defense.io` / `westerveldjp@gmail.com`
- **PGP Encryption Key:** Fingerprint `8F2A 4B91 03EC 7D88 C41E  2A66 B4D9 9120 77E1 A32F`
- **Encrypted Advisory Form:** Available via the in-app Security Compliance Portal (`/openssf`) or via private GitHub Security Advisory at `https://github.com/jurgen-paul/aegis-2045/security/advisories/new`.

### Response Timeline SLA
- **Initial Acknowledgment:** Within **24 hours**
- **Severity Assessment & Reproduction:** Within **48 hours**
- **Patch Development & Testing:** Within **7 days** (Critical) or **14 days** (Medium)
- **Public Disclosure:** Coordinated release and CVE issuance following standard 90-day responsible disclosure guidelines (or sooner by mutual agreement).

---

## 2. Basic Good Cryptographic Practices

AEGIS 2045 implements rigorous, modern cryptographic standards designed to withstand both classical and post-quantum threat models:

1. **Post-Quantum Key Encapsulation (PQ-KEM):** ML-KEM / CRYSTALS-Kyber-1024 paired with Dilithium-5 digital signatures (512-bit post-quantum security margin).
2. **Symmetric Encryption:** AES-256-GCM and ChaCha20-Poly1305 with authenticated encryption with associated data (AEAD). Nonces are generated via cryptographically secure pseudo-random number generators (`crypto.getRandomValues`).
3. **Secure Hashing & Key Derivation:** SHA-512, BLAKE3, and Argon2id for password and key derivation routines.
4. **Memory Hygiene & Zeroing:** Ephemeral session keys are zeroed upon session termination or after 60-second hardware enclave rotation.
5. **No Broken Algorithms:** MD5, SHA-1, DES, and raw RSA with PKCS#1 v1.5 are strictly rejected in all security pipelines.

---

## 3. Cryptography & US Export Controls (EAR Compliance Notice)

> **IMPORTANT NOTICE REGARDING US EXPORT CONTROLS:**
> Note that some software does not need to use cryptographic mechanisms. If your project produces software that (1) includes, activates, or enables encryption functionality, and (2) might be released from the United States (US) to outside the US or to a non-US-citizen, you may be legally required to take a few extra steps. Typically this just involves sending an email. For more information, see the encryption section of *Understanding Open Source Technology & US Export Controls*.

### Compliance Status under EAR 740.13(e) / ECCN 5D002:
Under Section 740.13(e) of the U.S. Export Administration Regulations (EAR), open source software that contains publicly available cryptographic source code is eligible for export under License Exception TSU (Technology and Software Unrestricted), provided that email notification has been sent to the Bureau of Industry and Security (BIS) and the NSA ENC Encryption Request Coordinator.

- **Filing Notification Target:** `crypt@bis.doc.gov` and `enc@nsa.gov`
- **Subject Line:** *TSU License Exception Notification for Open Source Cryptography: AEGIS-2045*
- **Public Repository URL:** `https://github.com/jurgen-paul/aegis-2045`
- **ECCN Classification:** 5D002 (Information Security Software - Publicly Available Source Code)

---

## 4. Secured Delivery Against Man-In-The-Middle (MITM) Attacks

All software delivery channels implement defense-in-depth against MITM interception:

- **Enforced Transport Encryption:** HTTPS with HSTS (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`) and TLS 1.3 only.
- **Subresource Integrity (SRI):** All third-party assets and scripts include `integrity="sha384-..."` attributes.
- **Checksum Verification:** Cryptographic release manifests (`SHA256SUMS`) signed with project GPG keys for every release.
- **Git Commit Signatures:** All releases and maintainer commits must be GPG/SSH signed (`git tag -s`).

---

## 5. Publicly Known Vulnerabilities & Dependency Auditing

- **Automated Dependency Audits:** Continuous dependency vulnerability scans via `npm audit` and Dependabot.
- **Zero Known CVEs:** Automated CI pipelines block merges on dependencies with known moderate, high, or critical CVEs.
- **Rapid Vulnerability Remediation:** Security patches are deployed into the Cloud Run container within 24 hours of upstream CVE disclosures.

---

## 6. Static Code Analysis

- **TypeScript Strict Compilation:** Built with strict type checking (`tsc --noEmit`), eliminating null-dereference and implicit-any errors.
- **Static Security Linters:** ESLint security plugins (`eslint-plugin-security`), SonarQube, and Semgrep SAST scanning rules covering OWASP Top 10 vulnerabilities (XSS, Injection, Broken Access Control).
- **Zero Compiler Warnings Policy:** Warning flags enabled across the entire build pipeline.

---

## 7. Dynamic Code Analysis

- **Automated In-Memory Attestation:** Hardware enclave attestation proofs simulated and verified via autonomous validation suite.
- **Fuzzing & Fault Injection:** Continuous boundary condition testing on coordinate parsing, packet header deserialization, and radar trajectory buffers.
- **Runtime Integrity Monitoring:** Live sensor stream anomalies and unexpected packet injections are automatically flagged and quarantined in the SIEM pipeline.
