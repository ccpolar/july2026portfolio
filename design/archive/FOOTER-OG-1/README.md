# FOOTER OG 1

The footer the site had before the painted alpine-lake landscape replaced it.
Kept so Cam can go back to it by name.

**What it looks like:** a linocut-style Rocky Mountain scene drawn as a single
hand-built SVG, in the theme's own colours rather than fixed ones — so it
followed the palette set in `/admin`, light mode and dark. Trees and aspen
circles sway on a slow wind, a mirrored cloud tile drifts leftward and loops
seamlessly, and the whole thing holds still until it scrolls into view.

**Archived:** 4 October 2026, from commit `10f7571`.

## Files

| In here | Goes back to |
| --- | --- |
| `components/SiteFooter.tsx` | `src/components/SiteFooter.tsx` |
| `components/SiteFooter.module.css` | `src/components/SiteFooter.module.css` |
| `components/MountainIllustration.tsx` | `src/components/MountainIllustration.tsx` |
| `components/FooterArt.tsx` | `src/components/FooterArt.tsx` |

## To restore it

Copy all four files back to `src/components/`, overwriting what's there. That
is the whole job — nothing outside these four files was part of this footer,
and none of them are imported by anything but the footer itself.

Two things to know before you do:

- The replacement footer owns the page's bottom spacing differently. If the
  footer ends up sitting too close to or too far from the section above it,
  that's `.footer`'s own `margin-top` in the restored
  `SiteFooter.module.css` — it is not set anywhere else.
- `MountainIllustration.tsx` is generated from a Paper design file, but it has
  hand edits applied after generation that the generator doesn't know about.
  They're listed in the comment at the top of that file. Regenerating it
  without reapplying them costs about two thirds of the footer's frame rate.

## Why it was replaced

Cam had a new hero and footer generated (painted cloud sky above, painted
alpine lake below) and asked for both backgrounds swapped in. This one wasn't
wrong; it was superseded. Hence the archive rather than a deletion.
