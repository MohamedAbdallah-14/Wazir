# Domain Rules: User-Facing Content

freshness_date: 2026-03-16

Rules for humanizing microcopy, glossary entries, i18n values, notification templates, and seed content. This module is an additive layer on top of `expertise/content/foundations/editorial-standards.md`, not a replacement. Editorial standards govern voice, tone, and grammar baseline. This module adds AI-pattern detection on top.

## Role Mappings

- **content-author** -- microcopy tables, i18n keys, glossary, notification templates, seed content

## Rules

### 1. Editorial standards govern baseline

All voice, tone, sentence case, and grammar rules from `expertise/content/foundations/editorial-standards.md` apply first. The humanizer adds AI-pattern removal as a second layer.

### 2. Conversational tone for UI text

Microcopy should sound like a knowledgeable colleague explaining something, not a press release. Replace formal AI phrasing with direct language.

```
# Wrong
"An error has been encountered while processing your request."

# Right
"Something went wrong. Try again, or contact support if it keeps happening."
```

### 3. Microcopy is exempt from burstiness analysis

UI strings are 3-8 words per item. Burstiness (sentence length variation) does not apply at this scale. Skip burstiness checks for individual microcopy entries. Burstiness may apply to longer content blocks like onboarding flows or help text.

### 4. Notification templates should feel human

Push notifications and email subjects have character limits. Write within those limits while avoiding AI tells.

```
# Wrong
"Your comprehensive order has been successfully processed and is being prepared."

# Right
"Order confirmed. We're packing it now."
```

### 5. Glossary terms must be precise

Do not apply synonym cycling to glossary definitions. A glossary exists to pin down meaning. If the term is "endpoint," every reference should say "endpoint" -- not "API surface," "service URL," or "access point."

### 6. Seed data should be realistic

Seed and fixture data should use plausible values, not "Lorem ipsum", "John Doe", or "test123". Use realistic names, addresses, and content that matches the product domain.

### 7. No vocabulary blacklist overrides for established UX terms

Some blacklisted words are established UX terminology. "User journey" is a legitimate UX mapping concept. "Ecosystem" may be the accepted term in a product's domain language. When a blacklisted word is the established term in the product glossary, keep it.

### 8. Accessibility copy has its own constraints

Screen reader text, ARIA labels, and alt text follow accessibility standards that override style preferences. Do not humanize alt text into conversational language -- keep it descriptive and functional per WCAG guidelines.

### 9. i18n values must stay translatable

Humanized strings must remain clean for translators. Avoid idioms that do not translate across languages. "Heads up" may work in English microcopy but breaks in Arabic or Japanese. Use direct phrasing that translates well.

### 10. Content coverage comes first

Every UI state needs copy. Missing microcopy for an error state, empty state, or loading state is a bigger failure than an AI tell in existing copy. Write the copy first, humanize second.
