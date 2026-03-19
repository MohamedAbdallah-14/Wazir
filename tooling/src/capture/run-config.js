import fs from 'node:fs';
import path from 'node:path';
import { readYamlFile } from '../loaders.js';

const DEFAULT_PHASE_POLICY = {
  loop_cap: 10,
  enabled: true,
};

export function readRunConfig(runPaths) {
  const configPath = path.join(runPaths.runRoot, 'run-config.yaml');
  if (!fs.existsSync(configPath)) {
    return { phase_policy: {} };
  }
  return readYamlFile(configPath);
}

export function getPhaseLoopCap(runConfig, phase) {
  // Support both workflow_policy (new) and phase_policy (legacy)
  const policyMap = runConfig?.workflow_policy ?? runConfig?.phase_policy ?? {};
  const policy = policyMap[phase] ?? DEFAULT_PHASE_POLICY;
  return policy.loop_cap ?? DEFAULT_PHASE_POLICY.loop_cap;
}
