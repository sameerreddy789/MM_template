#!/bin/bash
# ==============================================================================
# MohanaMantra Security Scan Script
# ==============================================================================
# Usage:
#   1. Set your environment variables first:
#      export STRIX_LLM="openai/gpt-4o"       # or your preferred model
#      export LLM_API_KEY="your-api-key"
#
#   2. Run the script:
#      bash testing/run-scan.sh [quick|standard|deep]
#
#   Default mode is "standard" if no argument is provided.
# ==============================================================================

set -e

# --- Configuration ---
SCAN_MODE="${1:-standard}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$PROJECT_ROOT"

# Budget limits per scan mode
case "$SCAN_MODE" in
  quick)
    MAX_BUDGET=5
    echo "🔍 Running QUICK scan (budget: \$$MAX_BUDGET)..."
    ;;
  standard)
    MAX_BUDGET=10
    echo "🔍 Running STANDARD scan (budget: \$$MAX_BUDGET)..."
    ;;
  deep)
    MAX_BUDGET=20
    echo "🔍 Running DEEP scan (budget: \$$MAX_BUDGET)..."
    ;;
  *)
    echo "❌ Unknown scan mode: $SCAN_MODE"
    echo "Usage: bash testing/run-scan.sh [quick|standard|deep]"
    exit 1
    ;;
esac

# --- Pre-flight checks ---
echo ""
echo "📋 Pre-flight checks..."

# Check Docker
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  exit 1
fi
echo "  ✅ Docker is running"

# Check Strix
if ! command -v strix &> /dev/null; then
  echo "❌ Strix is not installed. Install with:"
  echo "   curl -sSL https://strix.ai/install | bash"
  exit 1
fi
echo "  ✅ Strix is installed ($(strix --version))"

# Check LLM config
if [ -z "$STRIX_LLM" ] || [ -z "$LLM_API_KEY" ]; then
  echo "❌ LLM not configured. Set these environment variables:"
  echo "   export STRIX_LLM=\"openai/gpt-4o\""
  echo "   export LLM_API_KEY=\"your-api-key\""
  exit 1
fi
echo "  ✅ LLM configured ($STRIX_LLM)"

# --- Run the scan ---
echo ""
echo "🚀 Starting Strix pentest on MohanaMantra..."
echo "   Target: $TARGET"
echo "   Mode:   $SCAN_MODE"
echo "   Budget: \$$MAX_BUDGET"
echo ""

strix -n \
  -t "$TARGET" \
  --scan-mode "$SCAN_MODE" \
  --max-budget "$MAX_BUDGET" \
  --instruction "This is a React (Vite) cultural festival website for MohanaMantra 2K26 at MBU. Focus on: XSS in user inputs, CSRF on registration forms, exposed API keys or secrets in the codebase, insecure Firebase configuration, open redirect vulnerabilities, and any client-side security issues."

EXIT_CODE=$?

# --- Report results ---
echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Scan complete — no vulnerabilities found!"
elif [ $EXIT_CODE -eq 2 ]; then
  echo "⚠️  Scan complete — VULNERABILITIES FOUND!"
  echo "   Check the report in: strix_runs/<latest-run>/penetration_test_report.md"
else
  echo "❌ Scan failed with exit code $EXIT_CODE"
fi

exit $EXIT_CODE
