# Installation

## Claude Code Plugin (recommended)

The fastest way to use Wazir. Two commands in Claude Code:

```bash
/plugin marketplace add MohamedAbdallah-14/Wazir
/plugin install wazir
```

Skills, roles, and workflows are now available in your Claude sessions. No files to copy, no exports needed.

## Codex

Copy the generated host export to your project:

```bash
git clone https://github.com/MohamedAbdallah-14/Wazir.git
cd wazir && npm install && npx wazir export build
cp exports/hosts/codex/AGENTS.md ~/your-project/
```

## Gemini

```bash
git clone https://github.com/MohamedAbdallah-14/Wazir.git
cd wazir && npm install && npx wazir export build
cp exports/hosts/gemini/GEMINI.md ~/your-project/
```

## Cursor

```bash
git clone https://github.com/MohamedAbdallah-14/Wazir.git
cd wazir && npm install && npx wazir export build
cp -r exports/hosts/cursor/.cursor ~/your-project/
```

## npm (global CLI)

```bash
npm install -g @wazir-dev/cli
```

The CLI provides validation, export, indexing, and doctor commands. You still need to clone the source to build host exports.

## Homebrew (macOS)

```bash
brew tap MohamedAbdallah-14/Wazir
brew install wazir
```

## From Source (contributors)

```bash
git clone https://github.com/MohamedAbdallah-14/Wazir.git
cd wazir
npm ci
npx wazir doctor    # verify environment
npm test                 # run test suite
```

## Verify

After any install method, verify with:

```bash
npx wazir doctor
# PASS manifest: Manifest is valid.
# PASS hooks: Hook definitions are valid.
# PASS host-exports: All required host export directories exist.
```

## What's next

[Your First Run](02-first-run.md) — walk through the full pipeline from brief to shipped code.
