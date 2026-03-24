import fs from 'node:fs';
import path from 'node:path';

/**
 * Known superpowers skill names that conflict with Wazir skill names.
 * A Wazir skill may share a name with a superpowers skill ONLY if it uses
 * the wz: prefix — the Augment tier (CONTEXT.md companion) is not
 * implementable (concluded in Task 18 R2) and is no longer supported.
 */
const SUPERPOWERS_SKILL_NAMES = new Set([
  'brainstorming',
  'dispatching-parallel-agents',
  'executing-plans',
  'finishing-a-development-branch',
  'receiving-code-review',
  'requesting-code-review',
  'subagent-driven-development',
  'using-git-worktrees',
  'verification',
  'writing-plans',
  'writing-skills',
]);

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const fields = {};
  for (const line of match[1].split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    fields[key] = value;
  }

  return fields;
}

function hasEnforcementPhased(content) {
  // Check if frontmatter contains enforcement.phased: true
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return false;
  const fm = fmMatch[1];
  // Look for enforcement: block followed by phased: true
  const enfIdx = fm.indexOf('enforcement:');
  if (enfIdx === -1) return false;
  const afterEnf = fm.slice(enfIdx);
  return /phased:\s*true/m.test(afterEnf);
}

function listSkillDirs(skillsDir) {
  if (!fs.existsSync(skillsDir)) return [];

  return fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function validateSkillsAtProjectRoot(projectRoot) {
  const skillsDir = path.join(projectRoot, 'skills');
  const errors = [];
  const skillDirs = listSkillDirs(skillsDir);
  let checkedCount = 0;

  for (const dirName of skillDirs) {
    const skillMdPath = path.join(skillsDir, dirName, 'SKILL.md');

    if (!fs.existsSync(skillMdPath)) continue;

    checkedCount++;
    const content = fs.readFileSync(skillMdPath, 'utf8');
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter) {
      errors.push(`${dirName}: SKILL.md missing YAML frontmatter`);
      continue;
    }

    if (!frontmatter.name) {
      errors.push(`${dirName}: SKILL.md missing name field in frontmatter`);
      continue;
    }

    const skillName = frontmatter.name;
    const baseName = skillName.startsWith('wz:') ? skillName.slice(3) : skillName;
    const hasWzPrefix = skillName.startsWith('wz:');
    const conflictsWithSuperpowers = SUPERPOWERS_SKILL_NAMES.has(baseName);
    const contextMdPath = path.join(skillsDir, dirName, 'CONTEXT.md');
    const hasContextMd = fs.existsSync(contextMdPath);

    // Check: conflicting name without wz: prefix must be flagged.
    // Augment tier is not supported — the only resolution is the wz: prefix.
    if (conflictsWithSuperpowers && !hasWzPrefix) {
      errors.push(
        `${dirName}: skill name "${skillName}" conflicts with superpowers:${baseName} — ` +
        'add wz: prefix to resolve the conflict',
      );
    }

    // Check: enforcement.phased requires matching templates
    if (hasEnforcementPhased(content)) {
      const baseName2 = dirName;
      const templatesPath = path.join(projectRoot, 'templates', 'phases', 'skills', baseName2);
      if (!fs.existsSync(templatesPath)) {
        errors.push(
          `${dirName}: enforcement.phased is true but no templates found at templates/phases/skills/${baseName2}/`,
        );
      } else {
        const tplFiles = fs.readdirSync(templatesPath).filter(f => f.endsWith('.md'));
        if (tplFiles.length === 0) {
          errors.push(
            `${dirName}: enforcement.phased is true but templates directory is empty`,
          );
        }
      }
    }

    // Check: CONTEXT.md files are stale — augment tier is not implementable
    // (concluded in Task 18 R2). Flag any remaining CONTEXT.md as an error.
    if (hasContextMd) {
      errors.push(
        `${dirName}: CONTEXT.md is not supported — augment tier was removed. ` +
        'Delete CONTEXT.md; all Wazir skills use the Own tier with wz: prefix.',
      );
    }
  }

  if (errors.length > 0) {
    return {
      exitCode: 1,
      stderr: `Skill validation failed:\n- ${errors.join('\n- ')}\n`,
    };
  }

  return {
    exitCode: 0,
    stdout: `Skill validation passed. Checked ${checkedCount} skills.\n`,
  };
}
