# MohanaMantra Security Testing

This folder contains the security testing configuration for the MohanaMantra 2K26 website using [Strix](https://github.com/usestrix/strix) — an open-source AI penetration testing tool.

## Prerequisites

1. **Docker** must be running (`docker info` to verify)

2. **Strix CLI** installed:

   ```bash
   curl -sSL https://strix.ai/install | bash
   ```

3. **LLM API Key** configured (set these before running scans):

   ```bash
   export STRIX_LLM="<your-model>"        # e.g. openai/gpt-4o, anthropic/claude-sonnet-4-20250514, google/gemini-2.5-pro
   export LLM_API_KEY="<your-api-key>"
   ```

## How to Run Scans

### Quick Scan (fastest, ~5 minutes)

```bash
strix -n -t ./ --scan-mode quick --max-budget 5
```

### Standard Scan (recommended, ~30 minutes)

```bash
strix -n -t ./ --scan-mode standard --max-budget 10
```

### Deep Scan (thorough, can take hours)

```bash
strix -n -t ./ --scan-mode deep --max-budget 20
```

### Scan Deployed Site (black-box testing)

```bash
strix -n -t https://www.mohanamantra.com --scan-mode standard --max-budget 15
```

### Combined Scan (best coverage — code + deployed site)

```bash
strix -n -t ./ -t https://www.mohanamantra.com --max-budget 25
```

## Understanding Results

After a scan, results appear in `strix_runs/<run-name>/`:

| File                           | What it contains                              |
| ------------------------------ | --------------------------------------------- |
| `penetration_test_report.md`   | Executive summary — read this first           |
| `vulnerabilities/*.md`         | Individual findings with PoC and fix guidance |
| `vulnerabilities.json`         | Structured JSON of all findings               |
| `findings.sarif`               | SARIF format for CI/CD integration            |

## Exit Codes

| Code | Meaning                                      |
| ---- | -------------------------------------------- |
| `0`  | No vulnerabilities found                     |
| `1`  | Error (Docker down, missing config, etc.)    |
| `2`  | Vulnerabilities found — check the report     |

## What Strix Tests For

- **OWASP Top 10**: Injection, XSS, CSRF, SSRF, broken auth, etc.
- **API Security**: Endpoint exposure, auth bypass, IDOR
- **Business Logic**: Authorization flaws, privilege escalation
- **Client-side**: DOM-based XSS, clickjacking, open redirects
- **Dependency vulnerabilities**: Known CVEs in npm packages

## Fixing Vulnerabilities

After a scan finds issues, use:

```bash
# The fix-security-vulnerabilities-with-strix skill can auto-remediate
# and re-scan to verify the fix worked
```

## CI/CD Integration

See the `.agents/skills/ci-security-scanning-with-strix/` skill for GitHub Actions integration to scan on every PR.
