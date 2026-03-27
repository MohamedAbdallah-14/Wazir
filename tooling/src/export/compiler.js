import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { readJsonFile, readYamlFile } from '../loaders.js';
import { validateAgainstSchema } from '../schema-validator.js';
import { injectReminders } from '../pipeline/skill-reminder-injector.js';

const CAPABILITY_TO_CLAUDE_TOOLS = {
  read: ['Read'],
  write: ['Write'],
  edit: ['Edit'],
  shell: ['Bash'],
  search: ['Glob', 'Grep'],
  skills: ['Skill'],
  agents: ['Agent'],
  web: ['WebSearch', 'WebFetch'],
};

const MODEL_TIER_TO_CLAUDE = {
  orchestration: 'sonnet',
  exploration: 'sonnet',
  review: 'opus',
  implementation: 'sonnet',
};

function translateAgentPolicy(policy) {
  const tools = policy.capabilities
    .flatMap((cap) => CAPABILITY_TO_CLAUDE_TOOLS[cap] || []);

  const frontmatter = {
    tools,
    model: MODEL_TIER_TO_CLAUDE[policy.model_tier] || 'sonnet',
    maxTurns: policy.max_turns,
  };

  if (policy.isolation) {
    frontmatter.isolation = policy.isolation;
  }

  if (policy.mcp_servers) {
    frontmatter.mcpServers = policy.mcp_servers;
  }

  return frontmatter;
}

function renderFrontmatter(obj) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${item}`);
      }
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function listMarkdownFiles(dirPath) {
  return fs.readdirSync(dirPath)
    .filter((entry) => entry.endsWith('.md'))
    .sort()
    .map((entry) => path.join(dirPath, entry));
}

function listHookDefinitions(dirPath) {
  return fs.readdirSync(dirPath)
    .filter((entry) => entry.endsWith('.yaml'))
    .sort()
    .map((entry) => path.join(dirPath, entry));
}

function workflowFileName(workflowId) {
  return `${workflowId.replaceAll('_', '-')}.md`;
}

function listDeclaredRoleFiles(projectRoot, manifest) {
  return manifest.roles
    .map((role) => path.join(projectRoot, 'roles', `${role}.md`))
    .sort();
}

function listDeclaredWorkflowFiles(projectRoot, manifest) {
  return manifest.workflows
    .map((workflow) => path.join(projectRoot, 'workflows', workflowFileName(workflow)))
    .sort();
}

function collectCanonicalSources(projectRoot, manifest) {
  const sources = [
    path.join(projectRoot, 'wazir.manifest.yaml'),
    ...listDeclaredRoleFiles(projectRoot, manifest),
    ...listDeclaredWorkflowFiles(projectRoot, manifest),
    ...listHookDefinitions(path.join(projectRoot, 'hooks', 'definitions')),
  ];

  const hooksJson = path.join(projectRoot, 'hooks', 'hooks.json');
  if (fs.existsSync(hooksJson)) {
    sources.push(hooksJson);
  }

  // Agent policy source
  const compositionMap = path.join(projectRoot, 'expertise', 'composition-map.yaml');
  if (fs.existsSync(compositionMap)) {
    sources.push(compositionMap);
  }

  // CLAUDE.md template source
  const claudeTemplate = path.join(projectRoot, 'templates', 'exports', 'claude-md.md');
  if (fs.existsSync(claudeTemplate)) {
    sources.push(claudeTemplate);
  }

  return sources;
}

function toRelativeMap(projectRoot, filePaths) {
  return Object.fromEntries(
    filePaths.map((filePath) => {
      const relativePath = path.relative(projectRoot, filePath);
      return [relativePath, hashContent(fs.readFileSync(filePath, 'utf8'))];
    }),
  );
}

function renderCommonInstructions(host, manifest) {
  return [
    `# ${manifest.project.display_name} for ${host[0].toUpperCase()}${host.slice(1)}`,
    '',
    `This host package is generated from the canonical Wazir sources.`,
    '',
    '## Canonical facts',
    '',
    `- project: ${manifest.project.display_name}`,
    `- hosts: ${manifest.hosts.join(', ')}`,
    `- phases: ${manifest.phases.join(', ')}`,
    `- roles: ${manifest.roles.join(', ')}`,
    `- protected paths: ${manifest.protected_paths.join(', ')}`,
    `- state root default: ${manifest.paths.state_root_default}`,
    '',
    '## Source of truth',
    '',
    '- `wazir.manifest.yaml`',
    '- `roles/*.md`',
    '- `workflows/*.md`',
    '- `hooks/definitions/*.yaml`',
    '',
  ].join('\n');
}

const DEFAULT_CLAUDE_HOOKS = {
  hooks: {
    PreToolUse: [
      { matcher: 'Write|Edit', hooks: [{ type: 'command', command: './hooks/protected-path-write-guard' }] },
      { matcher: 'Bash', hooks: [{ type: 'command', command: './hooks/context-mode-router' }] },
    ],
    SessionStart: [
      { hooks: [{ type: 'command', command: './hooks/loop-cap-guard' }] },
      { matcher: 'startup|resume|clear|compact', hooks: [{ type: 'command', command: './hooks/session-start' }] },
    ],
  },
};

function renderClaudeSettings(projectRoot) {
  const hooksPath = path.join(projectRoot, 'hooks', 'hooks.json');
  if (fs.existsSync(hooksPath)) {
    const hooksContent = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
    return JSON.stringify(hooksContent, null, 2);
  }
  // Fallback: default hooks when hooks.json doesn't exist (e.g., new projects)
  return JSON.stringify(DEFAULT_CLAUDE_HOOKS, null, 2);
}

function renderCursorHooks() {
  return JSON.stringify({
    hooks: [
      {
        name: 'protected-path-write-guard',
        command: './hooks/protected-path-write-guard',
      },
      {
        name: 'loop-cap-guard',
        command: './hooks/loop-cap-guard',
      },
      {
        name: 'context-mode-router',
        command: './hooks/context-mode-router',
      },
      {
        name: 'session-start',
        command: './hooks/session-start',
      },
    ],
  }, null, 2);
}

function generateHostFiles(projectRoot, manifest, host) {
  const files = {};
  const roleFiles = listDeclaredRoleFiles(projectRoot, manifest);
  const workflowFiles = listDeclaredWorkflowFiles(projectRoot, manifest);

  // Load agent policy from composition-map (graceful fallback for projects without one)
  const compositionMapPath = path.join(projectRoot, 'expertise', 'composition-map.yaml');
  const compositionMap = fs.existsSync(compositionMapPath)
    ? readYamlFile(compositionMapPath)
    : {};
  const agentPolicy = compositionMap.agent_policy || {};

  if (host === 'claude') {
    // CLAUDE.md from template
    const templatePath = path.join(projectRoot, 'templates', 'exports', 'claude-md.md');
    if (fs.existsSync(templatePath)) {
      let template = fs.readFileSync(templatePath, 'utf8');
      template = template.replace(/\{\{project_name\}\}/g, manifest.project.display_name);
      template = template.replace(/\{\{phase_list\}\}/g,
        manifest.phases.map((p) => `- \`${p}\``).join('\n'));
      template = template.replace(/\{\{agent_list\}\}/g,
        Object.keys(agentPolicy).map((a) => `- \`${a}\``).join('\n'));
      template = template.replace(/\{\{protected_paths\}\}/g,
        manifest.protected_paths.join(', '));
      template = template.replace(/\{\{state_root\}\}/g,
        manifest.paths.state_root_default);
      files['CLAUDE.md'] = template;
    } else {
      files['CLAUDE.md'] = renderCommonInstructions(host, manifest);
    }

    files['.claude/settings.json'] = renderClaudeSettings(projectRoot);

    // Agent definitions with YAML frontmatter
    for (const roleFile of roleFiles) {
      const roleName = path.basename(roleFile, '.md');
      const roleContent = fs.readFileSync(roleFile, 'utf8');
      const policy = agentPolicy[roleName];

      if (policy) {
        const frontmatter = renderFrontmatter(translateAgentPolicy(policy));
        files[path.join('.claude', 'agents', path.basename(roleFile))] =
          `${frontmatter}\n\n${roleContent}`;
      } else {
        files[path.join('.claude', 'agents', path.basename(roleFile))] = roleContent;
      }
    }

    // Controller agent (not backed by a role file)
    const controllerPolicy = agentPolicy.controller;
    if (controllerPolicy) {
      const frontmatter = renderFrontmatter(translateAgentPolicy(controllerPolicy));
      files['.claude/agents/controller.md'] = `${frontmatter}\n\n# Controller\n\nPipeline orchestrator. Dispatches phase agents in sequence. Does not do phase work inline.\n\nRead the CLAUDE.md for dispatch rules and phase sequence.\n`;
    }

    // Merged reviewer-verifier agent
    const rvPolicy = agentPolicy['reviewer-verifier'];
    if (rvPolicy) {
      const frontmatter = renderFrontmatter(translateAgentPolicy(rvPolicy));
      const reviewerContent = fs.readFileSync(
        path.join(projectRoot, 'roles', 'reviewer.md'), 'utf8');
      const verifierContent = fs.readFileSync(
        path.join(projectRoot, 'roles', 'verifier.md'), 'utf8');
      files['.claude/agents/reviewer-verifier.md'] =
        `${frontmatter}\n\n${reviewerContent}\n\n---\n\n${verifierContent}`;
    }

    // Workflow commands
    for (const workflowFile of workflowFiles) {
      files[path.join('.claude', 'commands', path.basename(workflowFile))] =
        fs.readFileSync(workflowFile, 'utf8');
    }
  } else if (host === 'codex') {
    files['AGENTS.md'] = renderCommonInstructions(host, manifest);
  } else if (host === 'gemini') {
    files['GEMINI.md'] = renderCommonInstructions(host, manifest);
  } else if (host === 'cursor') {
    files[path.join('.cursor', 'rules', 'wazir-core.mdc')] = renderCommonInstructions(host, manifest);
    files[path.join('.cursor', 'hooks.json')] = renderCursorHooks();
  }

  return files;
}

function validateGeneratedMetadata(schemas, hostPackage, exportManifest) {
  const hostValidation = validateAgainstSchema(schemas.hostSchema, hostPackage);
  const exportValidation = validateAgainstSchema(schemas.exportSchema, exportManifest);

  if (!hostValidation.valid) {
    throw new Error(`Generated host package failed schema validation: ${hostValidation.errors.join('; ')}`);
  }

  if (!exportValidation.valid) {
    throw new Error(`Generated export manifest failed schema validation: ${exportValidation.errors.join('; ')}`);
  }
}

function loadGeneratedMetadataSchemas(projectRoot) {
  const hostSchemaPath = path.join(projectRoot, 'schemas', 'host-export-package.schema.json');
  const exportSchemaPath = path.join(projectRoot, 'schemas', 'export-manifest.schema.json');

  try {
    return {
      hostSchema: readJsonFile(hostSchemaPath),
      exportSchema: readJsonFile(exportSchemaPath),
    };
  } catch (error) {
    throw new Error(
      `Failed to load generated export schemas: ${hostSchemaPath}, ${exportSchemaPath}. ${error.message}`,
      { cause: error },
    );
  }
}

const SCRATCH_MARKER_FILE = '.wazir-export-scratch.json';

function writeScratchMarker(rootDir, payload) {
  fs.writeFileSync(
    path.join(rootDir, SCRATCH_MARKER_FILE),
    JSON.stringify(payload, null, 2),
  );
}

function deleteScratchMarker(rootDir) {
  fs.rmSync(path.join(rootDir, SCRATCH_MARKER_FILE), { force: true });
}

function hasScratchMarker(rootDir) {
  return fs.existsSync(path.join(rootDir, SCRATCH_MARKER_FILE));
}

function createStagedDirectory(hostDir) {
  const parentDir = path.dirname(hostDir);
  const hostName = path.basename(hostDir);
  const stagedDir = path.join(parentDir, `.${hostName}.staged-${process.pid}-${Date.now()}`);
  fs.rmSync(stagedDir, { recursive: true, force: true });
  fs.mkdirSync(stagedDir, { recursive: true });
  writeScratchMarker(stagedDir, { kind: 'staged', host: hostName });
  return stagedDir;
}

function cleanupHostScratchDirectories(hostDir) {
  const parentDir = path.dirname(hostDir);
  const hostName = path.basename(hostDir);

  if (!fs.existsSync(parentDir)) {
    return;
  }

  for (const entry of fs.readdirSync(parentDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const isScratchDir = (
      entry.name.startsWith(`.${hostName}.staged-`) ||
      entry.name.startsWith(`.${hostName}.backup-`)
    );

    if (isScratchDir && hasScratchMarker(path.join(parentDir, entry.name))) {
      fs.rmSync(path.join(parentDir, entry.name), { recursive: true, force: true });
    }
  }
}

function writeGeneratedTree(rootDir, generatedFiles) {
  const generatedRelativePaths = [];

  for (const [relativeFilePath, content] of Object.entries(generatedFiles)) {
    const absoluteFilePath = path.join(rootDir, relativeFilePath);
    fs.mkdirSync(path.dirname(absoluteFilePath), { recursive: true });
    fs.writeFileSync(absoluteFilePath, content);
    generatedRelativePaths.push(relativeFilePath);
  }

  return generatedRelativePaths.sort();
}

function createBackupDirectory(targetDir) {
  const parentDir = path.dirname(targetDir);
  const hostName = path.basename(targetDir);
  const backupDir = path.join(parentDir, `.${hostName}.backup-${process.pid}-${Date.now()}`);
  const hadTargetDir = fs.existsSync(targetDir);

  if (hadTargetDir) {
    fs.renameSync(targetDir, backupDir);
    try {
      writeScratchMarker(backupDir, { kind: 'backup', host: hostName });
    } catch (error) {
      try {
        fs.renameSync(backupDir, targetDir);
      } catch (rollbackError) {
        throw new Error(
          `Failed to mark backup directory for ${targetDir}: ${error.message}. Rollback also failed: ${rollbackError.message}`,
          { cause: error },
        );
      }

      throw new Error(
        `Failed to mark backup directory for ${targetDir}: ${error.message}`,
        { cause: error },
      );
    }
  }

  return {
    backupDir,
    hadTargetDir,
  };
}

function restoreBackupDirectory(targetDir, backupDir) {
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.renameSync(backupDir, targetDir);
}

function stageHostExport(projectRoot, manifest, sourceHashes, schemas, host) {
  const hostDir = path.join(projectRoot, 'exports', 'hosts', host);
  cleanupHostScratchDirectories(hostDir);
  const generatedFiles = generateHostFiles(projectRoot, manifest, host);
  const stagedHostDir = createStagedDirectory(hostDir);

  try {
    const generatedRelativePaths = writeGeneratedTree(stagedHostDir, generatedFiles);
    const hostPackage = {
      host,
      sources: Object.keys(sourceHashes),
      files: generatedRelativePaths.sort(),
    };
    const exportManifest = {
      host,
      source_hashes: sourceHashes,
    };

    validateGeneratedMetadata(schemas, hostPackage, exportManifest);

    fs.writeFileSync(
      path.join(stagedHostDir, 'host-package.json'),
      JSON.stringify(hostPackage, null, 2),
    );
    fs.writeFileSync(
      path.join(stagedHostDir, 'export.manifest.json'),
      JSON.stringify(exportManifest, null, 2),
    );

    return {
      host,
      hostDir,
      stagedHostDir,
    };
  } catch (error) {
    fs.rmSync(stagedHostDir, { recursive: true, force: true });
    throw error;
  }
}

function commitPreparedHost(preparedHost) {
  let backup = {
    backupDir: null,
    hadTargetDir: false,
  };

  try {
    backup = createBackupDirectory(preparedHost.hostDir);
    deleteScratchMarker(preparedHost.stagedHostDir);
    fs.renameSync(preparedHost.stagedHostDir, preparedHost.hostDir);
    return {
      ...preparedHost,
      ...backup,
    };
  } catch (error) {
    fs.rmSync(preparedHost.stagedHostDir, { recursive: true, force: true });

    if (backup.hadTargetDir && fs.existsSync(backup.backupDir) && !fs.existsSync(preparedHost.hostDir)) {
      try {
        restoreBackupDirectory(preparedHost.hostDir, backup.backupDir);
      } catch (rollbackError) {
        throw new Error(
          `Failed to replace ${preparedHost.hostDir}: ${error.message}. Rollback also failed: ${rollbackError.message}`,
          { cause: error },
        );
      }
    }

    throw error;
  }
}

function cleanupPreparedHosts(preparedHosts) {
  for (const preparedHost of preparedHosts) {
    fs.rmSync(preparedHost.stagedHostDir, { recursive: true, force: true });
  }
}

function rollbackCommittedHosts(committedHosts) {
  const rollbackErrors = [];

  for (const committedHost of [...committedHosts].reverse()) {
    if (!committedHost.hadTargetDir) {
      fs.rmSync(committedHost.hostDir, { recursive: true, force: true });
      continue;
    }

    try {
      restoreBackupDirectory(committedHost.hostDir, committedHost.backupDir);
    } catch (error) {
      rollbackErrors.push(`${committedHost.host}: ${error.message}`);
    }
  }

  return rollbackErrors;
}

function cleanupCommittedBackups(committedHosts) {
  const cleanupErrors = [];

  for (const committedHost of committedHosts) {
    if (!committedHost.hadTargetDir || !fs.existsSync(committedHost.backupDir)) {
      continue;
    }

    try {
      fs.rmSync(committedHost.backupDir, { recursive: true, force: true });
    } catch (error) {
      cleanupErrors.push(`${committedHost.host}: ${error.message}`);
    }
  }

  return cleanupErrors;
}

export function buildHostExports(projectRoot) {
  const manifest = readYamlFile(path.join(projectRoot, 'wazir.manifest.yaml'));
  const sourceFiles = collectCanonicalSources(projectRoot, manifest);
  const sourceHashes = toRelativeMap(projectRoot, sourceFiles);
  const schemas = loadGeneratedMetadataSchemas(projectRoot);
  const hosts = [];
  const preparedHosts = [];

  try {
    for (const host of manifest.hosts) {
      preparedHosts.push(stageHostExport(projectRoot, manifest, sourceHashes, schemas, host));
      hosts.push(host);
    }
  } catch (error) {
    cleanupPreparedHosts(preparedHosts);
    throw error;
  }

  const committedHosts = [];

  try {
    for (let index = 0; index < preparedHosts.length; index += 1) {
      committedHosts.push(commitPreparedHost(preparedHosts[index]));
    }
  } catch (error) {
    cleanupPreparedHosts(preparedHosts.slice(committedHosts.length));
    const rollbackErrors = rollbackCommittedHosts(committedHosts);

    if (rollbackErrors.length > 0) {
      throw new Error(
        `Host export build failed: ${error.message}. Cross-host rollback also failed: ${rollbackErrors.join('; ')}`,
        { cause: error },
      );
    }

    throw error;
  }

  const backupCleanupErrors = cleanupCommittedBackups(committedHosts);

  // Post-build: inject pipeline reminders into all skill files (Layer 2 enforcement)
  const skillsDir = path.join(projectRoot, 'skills');
  if (fs.existsSync(skillsDir)) {
    const skillDirs = fs.readdirSync(skillsDir).filter(d =>
      fs.statSync(path.join(skillsDir, d)).isDirectory(),
    );
    for (const dir of skillDirs) {
      const skillFile = path.join(skillsDir, dir, 'SKILL.md');
      if (fs.existsSync(skillFile)) {
        const content = fs.readFileSync(skillFile, 'utf8');
        const updated = injectReminders(content, `${dir}/SKILL.md`);
        if (updated !== content) {
          fs.writeFileSync(skillFile, updated, 'utf8');
        }
      }
    }
  }

  return {
    hosts,
    source_count: Object.keys(sourceHashes).length,
    warnings: backupCleanupErrors,
  };
}

export function checkHostExportDrift(projectRoot) {
  const manifest = readYamlFile(path.join(projectRoot, 'wazir.manifest.yaml'));
  const sourceHashes = toRelativeMap(projectRoot, collectCanonicalSources(projectRoot, manifest));
  const schemas = loadGeneratedMetadataSchemas(projectRoot);
  const drifts = [];

  for (const host of manifest.hosts) {
    const hostDir = path.join(projectRoot, 'exports', 'hosts', host);
    const packagePath = path.join(hostDir, 'host-package.json');
    const manifestPath = path.join(hostDir, 'export.manifest.json');

    if (!fs.existsSync(packagePath) || !fs.existsSync(manifestPath)) {
      drifts.push(`${host}: export package is missing`);
      continue;
    }

    const hostPackage = readJsonFile(packagePath);
    const exportManifest = readJsonFile(manifestPath);
    validateGeneratedMetadata(schemas, hostPackage, exportManifest);

    for (const relativeSourcePath of Object.keys(sourceHashes)) {
      if (exportManifest.source_hashes[relativeSourcePath] !== sourceHashes[relativeSourcePath]) {
        drifts.push(`${host}: drift detected for ${relativeSourcePath}`);
      }
    }

    for (const generatedFile of hostPackage.files) {
      if (!fs.existsSync(path.join(hostDir, generatedFile))) {
        drifts.push(`${host}: generated file missing ${generatedFile}`);
      }
    }
  }

  return drifts;
}
