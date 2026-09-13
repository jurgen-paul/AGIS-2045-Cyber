# Contributing to AEGIS 2045 & OpenSSF Best Practices

Thank you for your interest in contributing to the **AEGIS 2045 Cyber-Node** project! We adhere strictly to the **OpenSSF (Open Source Security Foundation) Best Practices** criteria.

---

## 1. Bug-Reporting Process

If you encounter a bug or unexpected behavior that is **not** a security vulnerability:

1. **Check Existing Issues:** Search `https://github.com/jurgen-paul/aegis-2045/issues` to verify the bug has not already been reported.
2. **Open a Detailed Issue:** Include the following information:
   - **Concise Title:** e.g., `[BUG] D3 heatmap fails to calculate density contours on zero coordinates`
   - **Environment Details:** OS, Browser, Node.js version, container version.
   - **Exact Steps to Reproduce:** Numbered step-by-step reproduction instructions.
   - **Expected vs Actual Behavior:** What you expected to see vs what occurred.
   - **Console / Terminal Logs:** Raw error messages and stack traces.

*(Note: For security vulnerabilities, follow [SECURITY.md](SECURITY.md) to preserve coordinated disclosure).*

---

## 2. New Functionality Testing Policy

All contributions introducing new functionality, features, or architectural adjustments **MUST** fulfill the following quality gates:

- **Automated Test Coverage:** Provide automated test specs in the `tests/` directory verifying the new feature.
- **Regression Testing:** Ensure all existing automated tests continue to pass (`npm run test`).
- **Edge Case Verification:** Include boundary tests (e.g. empty inputs, malformed coordinates, maximum payload sizes).
- **Zero Regressions:** Any PR without accompanying test validation will be requested to add test coverage prior to review.

---

## 3. Working Build System & Warning Flags

- **Standard Build Command:**
  ```bash
  npm run build
  ```
- **Strict Warning Flags:**
  All code must compile cleanly with zero TypeScript errors or linter warnings:
  ```bash
  npm run lint
  ```
- Any code introducing compiler warnings, unused imports, or non-deterministic behavior will fail the continuous integration quality gate.

---

## 4. Secure Development Knowledge

Contributors are required to follow defensive programming practices:

1. **Never commit secrets or API keys:** All keys belong in server-side environment variables documented in `.env.example`.
2. **Cryptographic Primitives:** Do not roll your own cryptographic primitives. Always utilize certified Web Crypto APIs, Kyber-1024, or standard AES-GCM implementations.
3. **Input Validation & Sanitization:** All incoming external payloads, voice commands, and query parameters must be typed and validated.
4. **Export Control Compliance:** When submitting cryptography improvements, confirm compliance with US Export Controls (EAR 740.13(e) / ECCN 5D002) as outlined in [SECURITY.md](SECURITY.md).

---

## 5. Development Workflow

1. Fork the public repository: `https://github.com/jurgen-paul/aegis-2045`
2. Create a topical branch: `git checkout -b feature/quantum-telemetry-fix`
3. Verify tests pass: `npm run test && npm run lint`
4. Commit your changes with GPG-signed commits: `git commit -S -m "feat(telemetry): add D3 contour bandwidth guard"`
5. Open a Pull Request referencing the related issue.
