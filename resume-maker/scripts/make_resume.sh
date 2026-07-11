#!/usr/bin/env bash
# make_resume.sh (portable) — build .docx (+ .pdf if LibreOffice is installed)
# from a resume JSON, with no sandbox dependencies.
# Usage:  bash make_resume.sh <resume.json> [output_basename]
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"

JSON="$1"
[ -z "$JSON" ] && { echo "Usage: bash make_resume.sh <resume.json> [output_basename]"; exit 1; }
BASE="${2:-$(python3 -c "import json;print(json.load(open('$JSON')).get('output','Resume').replace('.docx',''))")}"
DOCX="${BASE}.docx"

mkdir -p "$(dirname "$DOCX")" 2>/dev/null || true
DOCX_DIR="$(cd "$(dirname "$DOCX")" && pwd)"
DOCX_NAME="$(basename "$DOCX")"
PDF="$DOCX_DIR/${DOCX_NAME%.docx}.pdf"

# 1) ensure the docx npm package is available (installed beside the scripts)
( cd "$HERE" && node -e "require('docx')" 2>/dev/null ) || \
  ( echo "Installing docx ..."; cd "$HERE" && npm install docx >/dev/null 2>&1 )

# 2) build the .docx, 3) enable hyphenation + no-hyphen styles
node "$HERE/build_resume.js" "$JSON" "$DOCX"
python3 "$HERE/post_process.py" "$DOCX"

# 4) convert to PDF with a local LibreOffice, if present
SOFFICE="$(command -v soffice || command -v libreoffice || true)"
if [ -n "$SOFFICE" ]; then
  ( cd "$DOCX_DIR" && "$SOFFICE" --headless --convert-to pdf "$DOCX_NAME" >/dev/null 2>&1 )
  echo "Done -> $DOCX , $PDF"
  if command -v pdfinfo >/dev/null 2>&1; then
    echo -n "Pages: "; pdfinfo "$PDF" 2>/dev/null | awk '/Pages/{print $2}'
  fi
else
  echo "Done -> $DOCX   (LibreOffice not found, so no PDF was generated)"
  echo "Install LibreOffice for automatic PDF export, or open the .docx and Save As PDF."
fi
echo "If page count is wrong for the profile: set \"density\":\"compact\", trim the weakest project, or shorten the summary, then rerun."
