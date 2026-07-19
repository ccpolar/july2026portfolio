# Design Context

This project has `PRODUCT.md` (strategic brief: register, users, positioning, brand personality, anti-references) and `DESIGN.md` (visual system: color, typography, motion — currently a seed, since no site code exists yet). The `/impeccable` skill reads both before any design work. Re-run `/impeccable document` once real code exists to replace the DESIGN.md seed with extracted tokens.

## Architecture

Custom-designed **Next.js** app with **Payload CMS** in the same codebase (admin at `/admin`), backed by **Postgres**, deployed to **Vercel**. The backend exists so the owner can add/edit projects, copy, imagery, and theme colors through the admin UI — so model theme/colors and site text as Payload globals and projects as a collection. Everything the design surfaces should be content-driven, not hardcoded.
