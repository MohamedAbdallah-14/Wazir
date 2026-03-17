# Marketplace Listings Guide

This guide covers every distribution channel for Wazir.

---

## Install Methods

### npm (primary)

```bash
npx @wazir-dev/cli --help          # run directly
npm install -g @wazir-dev/cli      # or install globally
```

- **Package:** [`@wazir-dev/cli`](https://www.npmjs.com/package/@wazir-dev/cli)

### Homebrew (macOS)

```bash
brew tap MohamedAbdallah-14/Wazir
brew install wazir
```

- **Tap repo:** [`homebrew-wazir`](https://github.com/MohamedAbdallah-14/homebrew-wazir)
- **Formula source:** `homebrew/wazir.rb` in this repo

### Claude Code Plugin

Wazir ships as a Claude Code plugin. Users install in two steps:

```bash
# In Claude Code:
/plugin marketplace add MohamedAbdallah-14/Wazir
/plugin install wazir
```

- **Marketplace config:** `.claude-plugin/marketplace.json`
- **Plugin manifest:** `.claude-plugin/plugin.json`
- **Docs:** [Claude Code plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)

---

## Host Exports

Wazir generates host-native packages for each AI coding agent. After cloning and running `npx wazir export build`, deploy to your project:

| Host | Deploy command |
|------|---------------|
| **Claude** | `cp -r exports/hosts/claude/.claude ~/your-project/ && cp exports/hosts/claude/CLAUDE.md ~/your-project/` |
| **Codex** | `cp exports/hosts/codex/AGENTS.md ~/your-project/` |
| **Gemini** | `cp exports/hosts/gemini/GEMINI.md ~/your-project/` |
| **Cursor** | `cp -r exports/hosts/cursor/.cursor ~/your-project/` |

---

## MCP Registry

Wazir is listed in the MCP Registry as a metadata entry.

- **Config file:** `server.json` (repo root)
- **Schema:** `https://registry.modelcontextprotocol.io/schema/server.json`

---

## Post-Publish Checklist

Run through this checklist after every `npm publish`:

- [ ] **npm:** Confirm package is live at `https://www.npmjs.com/package/@wazir-dev/cli`
- [ ] **npx smoke test:** Run `npx @wazir-dev/cli --help` from a clean environment
- [ ] **Claude Code Plugin:** Run `/plugin marketplace add MohamedAbdallah-14/Wazir` then `/plugin install wazir`
- [ ] **GitHub Release:** Ensure a GitHub Release exists with tag matching the npm version
- [ ] **Homebrew:** Update SHA256 in `homebrew/wazir.rb` and push to `homebrew-wazir` tap repo
- [ ] **Host exports:** Run `npx wazir export --check` to verify no drift
- [ ] **CHANGELOG:** Verify `CHANGELOG.md` is updated with the new version entry
