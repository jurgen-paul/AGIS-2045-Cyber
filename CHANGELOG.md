# Changelog & Release Notes

All notable changes to the **AEGIS 2045 Cyber-Node** project are documented in this file.
The project adheres to [Semantic Versioning (SemVer 2.0.0)](https://semver.org/).

---

## [2.4.0] - 2026-09-13 (Current Release)

### Added
- **OpenSSF Best Practices Badge Certification:** Attained Passing Badge status fulfilling all 18 core security, quality, change control, and reporting criteria.
- **D3.js Real-Time Hazard Heatmap & Cluster Engine:** Added 2D Kernel Density Estimation (KDE) contour mapping, live sensor telemetry simulation, and multi-threshold regional cluster detection.
- **Voice-Guided Dispatch Console:** Implemented Web Speech Recognition voice commands, audio route guidance synthesis, and law enforcement alert broadcast.
- **US Export Controls EAR 740.13(e) Notice:** Documented public encryption compliance under ECCN 5D002 and TSU email notification procedure.
- **Automated Comprehensive Test Suite:** Added `npm test` verifying cryptography, zeroing, MITM defense, geodetics, and OpenSSF standards.
- **High-Resolution System Imagery:** Added 5 cinematic architecture visual assets for command center, OpenSSF badge emblem, quantum enclave, hazard heatmap, and security matrix.

### Security
- Added Subresource Integrity (SRI) and HTTPS/HSTS enforcement headers.
- Hardened 60-second automatic key rotation and memory register zeroing routines in `EnclaveVaultScreen`.
- Automated vulnerability scanning with 0 unpatched CVEs across all production dependencies.

---

## [2.3.0] - 2026-08-20

### Added
- **Global Locator Track-and-Trace:** Integrated geodetic coordinate tracking, 25km–1000km seek radius perimeter calculations, and village/city classification.
- **SIEM / SOC Remote Alert Dispatch:** Configurable webhook dispatches to remote Splunk, Elastic, and Datadog ingest endpoints.
- **Google Tasks Ops Integration:** Bidirectional synchronization of security mitigation checklists via Google Tasks API.

### Changed
- Refactored `CrimeSeekMap` SVG renderer for responsive viewport zooming and panning.

---

## [2.2.0] - 2026-07-15

### Added
- **6-Layer Zero-Trust Policy Matrix:** Dynamic policy switching between PERMISSIVE, BALANCED, STRICT, and PARANOID.
- **AI Cognitive Shield Chatbot:** Natural language security copilot with simulated voice synthesis and rapid threat mitigation.

### Fixed
- Fixed key rotation timer race condition on background tabs.
- Resolved memory leak in simulated biometrics radar sweep animation.

---

## [2.1.0] - 2026-06-01

### Added
- **Post-Quantum Cryptography Hardware Enclave:** Simulation of Kyber-1024 / Dilithium-5 (512-bit PQ) micro-enclave registers.
- **FIDO2 / WebAuthn Biometric Gate:** Hardware challenge attestation modal with simulated Passkey attestation.

---

## [2.0.0] - 2026-05-01

### Initial Major Release
- Initial public release of AEGIS 2045 Cyber-Node under Apache-2.0 FLOSS license.
- Core dashboard, network telemetry, and PDF dossier export generator.
