/**
 * Template renderer for phase files.
 *
 * Renders phase templates with workflow-conditional sections.
 * Uses regex-based string replacement — no external template library.
 *
 * Markers: {{#workflow.<name>}}...{{/workflow.<name>}}
 * - If workflow is enabled in policy: keep content, strip markers
 * - If workflow is disabled: remove entire block
 */

/**
 * Render a phase template with workflow policy and run ID.
 *
 * @param {string} template - Raw template content
 * @param {object} workflowPolicy - Workflow policy from run-config (e.g., { discover: { enabled: true } })
 * @param {string} runId - Run ID to substitute for <id> placeholders
 * @returns {string} Rendered template
 */
export function renderTemplate(template, workflowPolicy, runId) {
  let result = template;

  // Replace workflow conditional blocks
  const blockPattern = /\{\{#workflow\.(\w+)\}\}\n?([\s\S]*?)\{\{\/workflow\.\1\}\}\n?/g;
  result = result.replace(blockPattern, (_match, workflowName, content) => {
    const policy = workflowPolicy[workflowName];
    if (policy && policy.enabled === false) {
      return ''; // Remove disabled workflow block
    }
    return content; // Keep enabled workflow content (strip markers)
  });

  // Replace <id> placeholder with run ID
  result = result.replace(/<id>/g, runId);

  return result;
}
