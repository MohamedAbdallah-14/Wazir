#!/usr/bin/env bash
# Sync project state to plugin cache. Run after rollbacks, branch switches,
# or any time plugin and project diverge.

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN_DIR="$HOME/.claude/plugins/cache/wazir-marketplace/wazir/local"

if [ ! -d "$PLUGIN_DIR" ]; then
  echo "Plugin directory not found: $PLUGIN_DIR"
  exit 1
fi

# Sync settings
cp "$PROJECT_ROOT/.claude/settings.json" "$PLUGIN_DIR/.claude/settings.json"

# Sync skills (delete stale, copy current)
rm -rf "$PLUGIN_DIR/skills"
cp -r "$PROJECT_ROOT/skills" "$PLUGIN_DIR/skills"

# Sync hooks (delete stale, copy current)
rm -rf "$PLUGIN_DIR/hooks"
cp -r "$PROJECT_ROOT/hooks" "$PLUGIN_DIR/hooks"

# Clean pipeline state
rm -rf "$PROJECT_ROOT/.wazir/state/" 2>/dev/null || true

echo "Plugin synced. Restart Claude Code to apply."
