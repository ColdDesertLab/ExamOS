#!/usr/bin/env bash
# ExamOS installer — self-host voor iMac / MacBook
# Usage: curl -fsSL https://raw.githubusercontent.com/ColdDesertLab/ExamOS/master/install.sh | bash

set -e

REPO="https://github.com/ColdDesertLab/ExamOS.git"
INSTALL_DIR="$HOME/.examos"
LAUNCHER="$HOME/.local/bin/examos"
PORT="${EXAMOS_PORT:-8765}"

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        ExamOS Installer            ║${NC}"
echo -e "${BLUE}║  VWO Eindexamen Training System    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════╝${NC}"
echo

# Check dependencies
for cmd in git python3; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo -e "${RED}✗ $cmd is required but not installed${NC}"
    exit 1
  fi
done

# Clone or update
if [ -d "$INSTALL_DIR/.git" ]; then
  if [ "${EXAMOS_NO_UPDATE:-}" != "1" ]; then
    echo -e "${YELLOW}↻ Updating existing install...${NC}"
    cd "$INSTALL_DIR"
    git fetch origin master --quiet
    git reset --hard origin/master --quiet
  else
    echo -e "${YELLOW}◯ Skipping update (EXAMOS_NO_UPDATE=1)${NC}"
  fi
else
  echo -e "${YELLOW}↓ Cloning ExamOS...${NC}"
  git clone --quiet "$REPO" "$INSTALL_DIR"
fi

# Create launcher
mkdir -p "$(dirname "$LAUNCHER")"
cat > "$LAUNCHER" <<EOF
#!/usr/bin/env bash
# ExamOS launcher — opens local server and browser
INSTALL_DIR="$INSTALL_DIR"
PORT="\${EXAMOS_PORT:-$PORT}"
PID_FILE="\$INSTALL_DIR/.server.pid"

# Auto-update unless disabled
if [ "\${EXAMOS_NO_UPDATE:-}" != "1" ]; then
  (cd "\$INSTALL_DIR" && git fetch origin master --quiet 2>/dev/null && git reset --hard origin/master --quiet 2>/dev/null) || true
fi

# Kill old server if running
if [ -f "\$PID_FILE" ]; then
  OLD_PID=\$(cat "\$PID_FILE" 2>/dev/null || true)
  if [ -n "\$OLD_PID" ] && kill -0 "\$OLD_PID" 2>/dev/null; then
    kill "\$OLD_PID" 2>/dev/null || true
  fi
  rm -f "\$PID_FILE"
fi

# Start server in background
cd "\$INSTALL_DIR"
python3 -m http.server "\$PORT" >/dev/null 2>&1 &
echo \$! > "\$PID_FILE"

sleep 0.5

URL="http://localhost:\$PORT/ExamOS_v4.html"
echo "🎯 ExamOS running at \$URL"

# Open in default browser
if command -v open >/dev/null 2>&1; then
  open "\$URL"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "\$URL"
fi
EOF
chmod +x "$LAUNCHER"

# Ensure ~/.local/bin in PATH
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
  echo -e "${YELLOW}⚠ Add this to your shell profile (~/.zshrc or ~/.bashrc):${NC}"
  echo -e "   ${BLUE}export PATH=\"\$HOME/.local/bin:\$PATH\"${NC}"
  echo
fi

echo -e "${GREEN}✓ Installed to $INSTALL_DIR${NC}"
echo -e "${GREEN}✓ Launcher at $LAUNCHER${NC}"
echo
echo -e "${BLUE}Gebruik:${NC}"
echo -e "  ${GREEN}examos${NC}                         — open ExamOS in browser"
echo -e "  ${GREEN}EXAMOS_PORT=9000 examos${NC}        — custom port"
echo -e "  ${GREEN}EXAMOS_NO_UPDATE=1 examos${NC}      — skip auto-update"
echo
echo -e "${BLUE}Of gebruik de gedeployde versie:${NC}"
echo -e "  ${GREEN}https://exam-os-three.vercel.app${NC}"
echo
echo -e "${YELLOW}💡 Tip: add to home screen (iPad/iPhone) of install as app (Chrome desktop)${NC}"
