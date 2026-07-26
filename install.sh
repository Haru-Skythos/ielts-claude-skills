#!/usr/bin/env bash
# IELTS v3 skills installer (macOS / Linux / Git Bash)
set -euo pipefail

SKILLS_DIR="${HOME}/.claude/skills"
cd "$(dirname "$0")"

echo "Installing IELTS v3 skills to ${SKILLS_DIR} ..."
mkdir -p "$SKILLS_DIR"

for s in ielts ielts-writing ielts-reading ielts-listening ielts-speaking ielts-vocab ielts-plan ielts-dashboard; do
  echo "  - $s"
  rm -rf "${SKILLS_DIR:?}/${s}"
  # tar 复制以排除 node_modules / dist
  tar -c --exclude node_modules --exclude dist -f - "$s" | tar -x -f - -C "$SKILLS_DIR"
done

echo
echo "Done. Restart Claude Code, then type /ielts to start."
