---
name: wz:debugging
description: Use when behavior is wrong or verification fails. Follow an observe-hypothesize-test-fix loop instead of guesswork.
---

# Debugging

> **Note:** This skill uses Wazir CLI commands for symbol-first code
> exploration. If the CLI index is unavailable, fall back to direct file reads —
> the generic OBSERVE methodology (read files, inspect state, gather evidence)
> still applies.

Follow this order:

1. **Observe**

   Use symbol-first exploration to locate the fault efficiently:

   1. `wazir index search-symbols <suspected-area>`
      — find relevant symbols by name.
   2. `wazir recall symbol <name-or-id> --tier L1`
      — understand structure (signature, JSDoc, imports).
   3. Form a hypothesis based on L1 summaries.
   4. `wazir recall file <path> --start-line N --end-line M`
      — read ONLY the suspect code slice.
   5. Escalate to a full file read only if the bug cannot be localized from slices.
   6. If recall fails (no index/summaries), fall back to direct file reads — the
      generic OBSERVE methodology (read files, inspect state, gather evidence)
      still applies.

   Also record the exact failure, reproduction path, command output, and current
   assumptions.

2. **Hypothesize**

   List 2-3 plausible root causes and rank them.

3. **Test**

   Run the smallest discriminating check that can confirm or reject the top hypothesis.

4. **Fix**

   Apply the minimum corrective change, then rerun the failing check and the relevant broader verification set.

Rules:

- change one thing at a time
- keep evidence for each failed hypothesis
- if three cycles fail, record the blocker in the active execution artifact or handoff instead of inventing certainty
