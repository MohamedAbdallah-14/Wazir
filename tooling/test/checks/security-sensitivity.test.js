import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { detectSecurityPatterns, SECURITY_REVIEW_DIMENSIONS } from '../../src/checks/security-sensitivity.js';

describe('detectSecurityPatterns', () => {
  it('detects auth-related patterns in added lines', () => {
    const diff = `diff --git a/src/auth.js b/src/auth.js
+++ b/src/auth.js
+const token = req.headers.authorization;
+const password = req.body.password;
`;
    const result = detectSecurityPatterns(diff);
    assert.equal(result.triggered, true);
    assert.ok(result.patterns.includes('token'));
    assert.ok(result.patterns.includes('password'));
    assert.ok(result.files.includes('src/auth.js'));
  });

  it('detects SQL and query patterns', () => {
    const diff = `diff --git a/src/db.js b/src/db.js
+++ b/src/db.js
+const result = db.query(\`SELECT * FROM users WHERE id = \${id}\`);
`;
    const result = detectSecurityPatterns(diff);
    assert.equal(result.triggered, true);
    assert.ok(result.patterns.includes('query'));
  });

  it('ignores removed lines (starting with -)', () => {
    const diff = `diff --git a/src/old.js b/src/old.js
+++ b/src/old.js
-const password = 'removed';
 const x = 42;
`;
    const result = detectSecurityPatterns(diff);
    assert.equal(result.triggered, false);
  });

  it('returns false for non-security changes', () => {
    const diff = `diff --git a/src/utils.js b/src/utils.js
+++ b/src/utils.js
+function formatDate(d) { return d.toISOString(); }
`;
    const result = detectSecurityPatterns(diff);
    assert.equal(result.triggered, false);
    assert.deepEqual(result.patterns, []);
    assert.deepEqual(result.files, []);
  });

  it('handles empty or null input', () => {
    assert.equal(detectSecurityPatterns('').triggered, false);
    assert.equal(detectSecurityPatterns(null).triggered, false);
    assert.equal(detectSecurityPatterns(undefined).triggered, false);
  });

  it('detects multiple files with security patterns', () => {
    const diff = `diff --git a/src/auth.js b/src/auth.js
+++ b/src/auth.js
+const jwt = sign(payload);
diff --git a/src/api.js b/src/api.js
+++ b/src/api.js
+fetch(url, { headers: { cookie: sessionId } });
`;
    const result = detectSecurityPatterns(diff);
    assert.equal(result.triggered, true);
    assert.ok(result.patterns.includes('jwt'));
    assert.ok(result.patterns.includes('cookie'));
    assert.equal(result.files.length, 2);
  });

  it('exports security review dimensions', () => {
    assert.ok(SECURITY_REVIEW_DIMENSIONS.length >= 6);
    assert.ok(SECURITY_REVIEW_DIMENSIONS.some(d => d.includes('Injection')));
    assert.ok(SECURITY_REVIEW_DIMENSIONS.some(d => d.includes('XSS')));
  });
});
