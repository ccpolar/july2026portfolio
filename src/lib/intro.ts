/**
 * Marks that the intro has played (or been ruled out) for this browsing
 * session. A session cookie, not sessionStorage: sessionStorage belongs to a
 * single tab, so a visitor opening the site in a new tab — a typed address, a
 * bookmark, a link from another app — would see the intro again. A cookie with
 * no expiry is shared by every tab and cleared when the browser closes, which
 * is exactly "once per browsing session".
 */
export const INTRO_SEEN_COOKIE = 'campagano_intro_seen'

/**
 * Inlined into the layout's <head> so it runs before first paint: the decision
 * to play is made before the page is ever drawn, so there's no flash of the
 * site first and no flash of the overlay once it has been seen.
 *
 * - Plays only if neither the session cookie nor (as a fallback for browsers
 *   that block cookies) the tab's sessionStorage says it has been seen.
 * - If the visit can't be remembered at all, it doesn't play: replaying on
 *   every page would be worse than never playing.
 * - Skips for reduced motion.
 * - Removes itself after 20s regardless (longer than the slowest allowed
 *   sequence: 3s preload + 10 × 1.5s + fade), so a failed script bundle can
 *   never leave the site covered.
 * - Handles the Skip button until React takes over, so a click that lands
 *   before hydration still works.
 *
 * Lives outside the client component on purpose: a server component importing
 * a plain value from a 'use client' module gets a client reference, not the
 * string.
 */
export const INTRO_BOOT_SCRIPT = `(function(){try{
var d=document.documentElement,n=${JSON.stringify(INTRO_SEEN_COOKIE)};
var hasCookie=function(){return (';'+document.cookie).replace(/\\s/g,'').indexOf(';'+n+'=1')>-1};
var ss=null;try{ss=window.sessionStorage}catch(e){}
var seenInTab=false;try{seenInTab=!!(ss&&ss.getItem(n))}catch(e){}
if(hasCookie()||seenInTab||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
document.cookie=n+'=1; path=/; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');
var remembered=hasCookie();
if(!remembered&&ss){try{ss.setItem(n,'1');remembered=true}catch(e){}}
if(!remembered)return;
d.setAttribute('data-intro','run');
setTimeout(function(){d.removeAttribute('data-intro')},20000);
document.addEventListener('click',function(e){var t=e.target;if(t&&t.closest&&t.closest('[data-intro-skip]'))d.removeAttribute('data-intro')},true);
}catch(e){}})();`
