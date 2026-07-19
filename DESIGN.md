<!-- SEED: re-run /impeccable document once there's code to capture the actual tokens and components. -->

---
name: Cam — Portfolio
description: A warm, precise personal portfolio built to earn calm trust from potential clients.
---

# Design System: Cam — Portfolio

## 1. Overview

**Creative North Star: "The Warm Precision"**

This system pairs a warm, muted anchor color with a single refined sans typeface and generous, deliberate whitespace — the same restraint that made majd-portfolio.framer.website feel considered rather than decorated: clean typographic hierarchy, subtle motion that responds rather than performs, and work presented as clear case studies instead of a decorative grid. Color stays quiet so the work itself carries the persuasion; every surface choice should lower the perceived risk of reaching out, not chase excitement.

It explicitly rejects the generic-template feel named in PRODUCT.md: no interchangeable hero-photo-plus-grid layout, no boilerplate section rhythm that makes one freelancer's site indistinguishable from the next.

**Key Characteristics:**
- Restrained color: tinted warm neutrals + one muted accent, used sparingly
- Single refined sans typeface carrying the full hierarchy, not a display/body pairing
- Generous whitespace; editorial control over decoration
- Responsive motion only — purposeful feedback and transitions, no choreographed scroll sequences
- Case-study-first structure for featured work

## 2. Colors

Restrained strategy: tinted warm neutrals dominate, with one deep, muted warm-neutral accent (terracotta/umber/warm-charcoal family) held in reserve for emphasis, not decoration.

### Primary
- **[Deep Muted Warm Neutral — name TBD]** (`[to be resolved during implementation]`): the single accent. Reserved for the primary CTA and key emphasis moments only.

### Neutral
- **[Warm-tinted paper/background — name TBD]** (`[to be resolved during implementation]`): base background.
- **[Ink/body text — name TBD]** (`[to be resolved during implementation]`): body copy; must clear 4.5:1 against the background — resolve exact values at implementation, not light gray.

### Named Rules
**The Quiet Accent Rule.** The warm-neutral accent appears on ≤10% of any given screen. Work imagery supplies the color; chrome stays quiet.

## 3. Typography

**Display Font:** `[single refined sans — family to be chosen at implementation]`
**Body Font:** same family, different weight — no separate body face.

**Character:** One humanist/refined sans carrying every level of hierarchy through weight and size alone, not a display/body contrast pair. Quieter and more product-like than an editorial serif pairing.

### Hierarchy
- **Display** (`[weight/size TBD]`): hero and section headers; `text-wrap: balance`.
- **Headline** (`[weight/size TBD]`): case-study titles.
- **Body** (`[weight/size TBD]`): 65–75ch max line length; must hit ≥4.5:1 contrast.
- **Label** (`[weight/size TBD]`): metadata, captions, nav.

## 4. Elevation

Flat by default. Responsive-tier motion means depth comes from spacing and layering of content, not shadow — elevation, if used at all, appears only as a subtle response to hover/focus state, never as ambient decoration.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Any shadow is a direct response to interaction state, not a resting decoration.

## 6. Do's and Don'ts

### Do:
- **Do** let case studies and work samples carry the persuasion; keep supporting copy minimal.
- **Do** treat whitespace and restraint as the credibility signal — this system's craft shows through what's left out.
- **Do** keep the accent color rare (≤10% of any screen) so it reads as emphasis, not decoration.
- **Do** keep motion purposeful and responsive — feedback and transitions only, no choreographed scroll sequences.
- **Do** keep the path from "convinced" to "in touch" (email/book a call, or the newsletter as fallback) obvious and frictionless.

### Don't:
- **Don't** build a generic template feel — no interchangeable hero-photo-plus-grid layout or stock Squarespace/Webflow portfolio scaffolding (per PRODUCT.md anti-reference).
- **Don't** use light gray "elegant" body text — body copy must clear 4.5:1 contrast against its background.
- **Don't** add choreographed scroll animation or flashy motion; it fights the calm-trust goal.
- **Don't** layer shadows or glassmorphism decoratively — this system is flat by default.
