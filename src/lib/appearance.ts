/**
 * Which palette the site is showing. Stored per browser, so a visitor's
 * choice sticks across visits. With nothing stored the site opens in light:
 * the day version is the one the work is photographed and laid out for, and
 * night is somewhere you choose to go rather than somewhere a laptop setting
 * puts you.
 */
export const THEME_STORAGE_KEY = 'campagano_theme'

/** Fired on <html> when the palette actually changes, so anything drawing its
 *  own colours (the backdrop canvas, the painted scenes) can re-read the
 *  tokens. */
export const THEME_CHANGE_EVENT = 'campagano:themechange'

/** Fired on <html> when a change has been asked for but hasn't happened yet,
 *  so the sky can run the sun down before the palette turns over. Carries the
 *  palette being moved to. */
export const THEME_TRANSITION_EVENT = 'campagano:themetransition'

export type ThemeName = 'light' | 'dark'

/**
 * How long the sun takes to set, and how far into that the palette turns
 * over. The swap is hidden under the warmest part of the wash, which is what
 * stops it reading as a light switch being flipped.
 */
export const SKY_TRANSITION_MS = 1500
export const SKY_SWAP_AT_MS = 620
/** How long before the end the page's own moon is let back in, so the risen
 *  one is still there to cross over to rather than blinking out. */
export const SKY_HANDOVER_MS = 420

/**
 * Inlined into <head> so it runs before first paint: the page is drawn in the
 * right palette straight away rather than flashing one and correcting after
 * hydration.
 *
 * Only an explicit stored choice turns the lights off. The attribute is
 * written in both cases because the CSS targets [data-theme='dark'] and
 * several rules key off [data-theme='light'] too.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{
var k=${JSON.stringify(THEME_STORAGE_KEY)},s=null;
try{s=localStorage.getItem(k)}catch(e){}
var dark=s==='dark';
var e=document.documentElement;
e.setAttribute('data-theme',dark?'dark':'light');
e.style.colorScheme=dark?'dark':'light';
}catch(e){}})();`

/** Does this visitor want as little movement as possible? */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Turn the palette over now, and tell everything that paints its own colours. */
export const applyTheme = (next: ThemeName, remember = true) => {
  const root = document.documentElement
  root.setAttribute('data-theme', next)
  root.style.colorScheme = next
  if (remember) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      /* storage blocked — the choice lasts for this page only */
    }
  }
  root.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT))
}

/**
 * Ask for the other palette.
 *
 * Normally this hands off to the sky, which runs the sun down and turns the
 * palette over in the middle of it. If nothing is listening — the component
 * hasn't mounted, or this page doesn't have it — the change still happens,
 * just immediately; the animation is decoration over a plain state change,
 * never the thing that performs it. Someone who has asked for less movement
 * gets the plain version too.
 */
export const requestTheme = (next: ThemeName) => {
  if (prefersReducedMotion()) {
    applyTheme(next)
    return
  }
  const event = new CustomEvent(THEME_TRANSITION_EVENT, { detail: { to: next }, cancelable: true })
  const handled = !document.documentElement.dispatchEvent(event)
  if (!handled) applyTheme(next)
}
