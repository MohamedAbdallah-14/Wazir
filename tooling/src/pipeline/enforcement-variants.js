/**
 * Enforcement message variants — Layer 2 compliance.
 *
 * Three pools: START (request), MID (reinforce), END (challenge).
 * Every variant ends with a question to force active engagement.
 * Plain text, no HTML comments — reads as conversation, not metadata.
 *
 * Based on "Lost in the Middle" attention zones: primacy, middle, recency.
 */

export const START_VARIANTS = [
  'Before you do anything else — open your phase checklist at .wazir/runs/latest/phases/ and follow every single step. If a wz: skill covers what you\'re about to do, use the skill instead of doing it manually. Did you actually check the checklist?',

  'Hey. The pipeline exists for a reason. Pull up your current phase checklist and go through it step by step. If there\'s a wz: skill that applies, invoke it before doing anything else. What phase are you in right now?',

  'First things first: your phase checklist at .wazir/runs/latest/phases/ lists exactly what needs to happen. Read it. Follow it. Don\'t skip ahead because the task looks simple. Which phase are you starting?',

  'You have a checklist at .wazir/runs/latest/phases/. Go read it before you write a single line of code or make any changes. If a wz: skill applies, you need to invoke it. Have you read your checklist yet?',

  'Stop. Before you start working — what does your phase checklist say? Go read .wazir/runs/latest/phases/ and follow it. Every item, not just the ones that feel important. What\'s the first unchecked item?',

  'Real talk: the pipeline steps aren\'t suggestions. Check .wazir/runs/latest/phases/ for your current checklist and work through it. Use wz: skills when they apply — that\'s not optional. What phase are you starting?',

  'Quick check before you begin — is there a wz: skill for what you\'re about to do? If yes, use it. Also, your phase checklist at .wazir/runs/latest/phases/ needs to be open and followed. Have you looked at it?',

  'Don\'t jump into implementation. Open your phase checklist at .wazir/runs/latest/phases/ first. Read it, follow it. Every step matters, even the ones that seem redundant. What\'s your first action according to the checklist?',

  'You tend to skip pipeline steps when context gets long. Fight that habit right from the start. Check .wazir/runs/latest/phases/ right now and follow what it says. What does your checklist tell you to do first?',

  'The pipeline isn\'t decoration. It\'s the process. Start by reading your current phase file at .wazir/runs/latest/phases/. If a skill applies, use the skill — no exceptions. Which checklist items apply to this task?',

  'Before anything else happens here: read your phase checklist. It\'s at .wazir/runs/latest/phases/. Every item on it is there because skipping it caused problems before. Are you going to follow it or skip it?',

  'Here\'s how this works: you check .wazir/runs/latest/phases/ for your current phase, you read every item, and you do them in order. If a wz: skill exists for a step, you use it. No shortcuts. What does your checklist say?',
];

export const MID_VARIANTS = [
  'Pause for a second. Are you still following your phase checklist? If you skipped something because it felt unnecessary, go back and do it now. What did you skip?',

  'Mid-task check: look at your phase checklist again. Is every completed item actually done with real output, or did you just move past it mentally? Which items have you genuinely finished?',

  'Be honest — have you been following the pipeline, or did you start freelancing halfway through? Go back to .wazir/runs/latest/phases/ and verify your progress. What step are you actually on?',

  'Stop and think: did you use a wz: skill for every step that has one? If you talked yourself out of using a skill, that\'s exactly the pattern that kills quality. What did you rationalize away?',

  'Context rot happens right about now. You\'ve been working for a while and the checklist feels like a distant memory. Go re-read it. Are you still on track or have you drifted? What changed?',

  'Halfway through. The most common failure mode is skipping steps in the middle because momentum feels productive. Momentum without process is just speed in the wrong direction. What\'s your current checklist status?',

  'This is the point where compliance usually drops off. You feel like you\'re making progress so you stop checking the list. Don\'t fall into that trap. Pull up .wazir/runs/latest/phases/ again. What\'s next on it?',

  'If you\'ve been working without checking your phase file for more than a few steps, that\'s a red flag. Go look at it now. Are there items you should have completed already but didn\'t? What got missed?',

  'Sanity check: are you still using wz: skills where they apply, or did you start doing things manually because it felt faster? The skills exist for consistency, not convenience. Which skill should you be using right now?',

  'The middle of a task is where shortcuts creep in. You tell yourself you\'ll catch up on process later. You won\'t — that never happens. Check your checklist now. What are you behind on?',

  'Right about now your attention on process is at its lowest. That\'s not a guess, it\'s a measured pattern. Counter it by re-reading .wazir/runs/latest/phases/. What items are you about to skip?',

  'Look at your recent actions. Did each one follow from a checklist item, or are you improvising? Improvisation means drift. Go back to .wazir/runs/latest/phases/ and realign. Where did you go off-script?',
];

export const END_VARIANTS = [
  'I don\'t think you followed every step. Before you call this done, go through your phase checklist item by item and check each one against what you actually did. Is each one genuinely completed, or did you just check the box?',

  'Before you wrap up: did you actually verify each checklist item has real output, or are you about to claim completion based on the feeling that you\'re done? What concrete evidence do you have for each item?',

  'Honest question — if someone audited your work right now against the phase checklist, would every item hold up with evidence? Or would they find skipped steps and empty checkmarks? Which ones would fail the audit?',

  'You\'re about to say you\'re done. Are you really? Go back to .wazir/runs/latest/phases/ and check every item one more time. If something was skipped or half-done, now is the time to finish it. What was left incomplete?',

  'Completion claims without verification evidence are worthless. For each phase checklist item — what specific output proves it was actually done? Can you point to something concrete for every single one?',

  'Last check: did you use every applicable wz: skill, or did you handle things manually that should have gone through a skill? Be specific about which skills you used and which you decided to skip. Why did you skip them?',

  'I\'m skeptical that everything on your checklist actually got done properly. Not because you\'re careless, but because context degrades and steps get rationalized away over time. Prove me wrong — what\'s the real status of every item?',

  'Before you finish, here\'s the test: read each checklist item out loud to yourself and ask "did I really do this, or did I think about doing it and move on?" Give yourself an honest answer. What\'s the truth?',

  'Almost done? Then you should be able to list every phase checklist item and show exactly where you completed it with real evidence. If you can\'t do that, you\'re not actually done. Can you list them all with proof?',

  'This is the moment where quality falls through the cracks — right at the end when you want to wrap up and move on. Fight that urge. Go through every checklist item one final time. Are you genuinely done, or just tired of the task?',

  'Wrapping up is when the most steps get silently dropped. Before you declare completion, pull up .wazir/runs/latest/phases/ and match every item to something you actually produced. What can\'t you account for?',

  'Final challenge: name every checklist item you completed and what you produced for each one. If any answer is "I think I covered that" instead of "here\'s the output," you have more work to do. Which items are you unsure about?',
];

/** All variants combined — used by the injector for stripping old reminders. */
export const ALL_VARIANTS = [...START_VARIANTS, ...MID_VARIANTS, ...END_VARIANTS];
