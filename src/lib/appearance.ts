/**
 * Which palette the site is showing. Stored per browser, so a visitor's
 * choice sticks across visits; with nothing stored the site follows the
 * device's own light/dark setting.
 */
export const THEME_STORAGE_KEY = 'campagano_theme'

/** Fired on <html> when the toggle switches, so anything drawing its own
 *  colours (the backdrop canvas) can re-read the tokens. */
export const THEME_CHANGE_EVENT = 'campagano:themechange'

/**
 * Inlined into <head> so it runs before first paint: the page is drawn in the
 * right palette straight away rather than flashing light and correcting after
 * hydration.
 *
 * It sets data-theme to an explicit 'light' or 'dark' either way — the CSS
 * targets [data-theme='dark'], and writing the attribute in both cases means a
 * visitor who chose light isn't flipped back by a device that prefers dark.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{
var k=${JSON.stringify(THEME_STORAGE_KEY)},s=null;
try{s=localStorage.getItem(k)}catch(e){}
var dark=s==='dark'||(s!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
var e=document.documentElement;
e.setAttribute('data-theme',dark?'dark':'light');
e.style.colorScheme=dark?'dark':'light';
}catch(e){}})();`
