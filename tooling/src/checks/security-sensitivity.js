const SECURITY_PATTERNS = [
  'auth', 'password', 'passwd', 'token', 'query', 'sql',
  'fetch', 'upload', 'secret', 'env', 'api[._-]?key',
  'session', 'cookie', 'cors', 'csrf', 'jwt', 'oauth',
  'encrypt', 'decrypt', 'hash', 'salt', 'credential',
  'private[._-]?key', 'access[._-]?token', 'refresh[._-]?token',
];

const PATTERN_REGEX = new RegExp(
  `\\b(${SECURITY_PATTERNS.join('|')})\\b`,
  'gi'
);

/**
 * Scan diff text for security-sensitive patterns.
 * Returns which patterns were found and in which files.
 */
export function detectSecurityPatterns(diffText) {
  if (!diffText || typeof diffText !== 'string') {
    return { triggered: false, patterns: [], files: [] };
  }

  const matchedPatterns = new Set();
  const matchedFiles = new Set();
  let currentFile = null;

  for (const line of diffText.split('\n')) {
    // Track current file from diff headers
    const fileMatch = line.match(/^(?:diff --git a\/\S+ b\/|[+]{3} b\/)(.+)/);
    if (fileMatch) {
      currentFile = fileMatch[1];
      continue;
    }

    // Only scan added/modified lines (starting with +, not +++)
    if (!line.startsWith('+') || line.startsWith('+++')) continue;

    const lineMatches = line.match(PATTERN_REGEX);
    if (lineMatches) {
      for (const m of lineMatches) {
        matchedPatterns.add(m.toLowerCase());
      }
      if (currentFile) {
        matchedFiles.add(currentFile);
      }
    }
  }

  const patterns = [...matchedPatterns].sort();
  const files = [...matchedFiles].sort();

  return {
    triggered: patterns.length > 0,
    patterns,
    files,
  };
}

/**
 * Security review dimensions to add when patterns are detected.
 */
export const SECURITY_REVIEW_DIMENSIONS = [
  'Injection (SQL, command, template, header)',
  'Authentication bypass',
  'Data exposure (PII, secrets, tokens in logs/responses)',
  'CSRF / SSRF',
  'XSS (stored, reflected, DOM)',
  'Secrets leakage (hardcoded keys, env vars in client code)',
];
