/** sessionStorage flag: the intro has played (or been ruled out) this visit. */
export const INTRO_SEEN_KEY = 'campagano:intro-seen'

/**
 * Inlined into the layout's <head> so it runs before first paint: the decision
 * to play is made before the page is ever drawn, so there's no flash of the
 * site first and no flash of the overlay on a visit that has already seen it.
 * Skips for reduced motion, and removes itself after 20s regardless (longer
 * than the slowest allowed sequence: 3s preload + 10 × 1.5s + fade), so a
 * failed script bundle can never leave the site covered. It also handles the
 * Skip button until React takes over: a click that lands before hydration
 * would otherwise do nothing and leave the intro running.
 *
 * Lives outside the client component on purpose: a server component importing
 * a plain value from a 'use client' module gets a client reference, not the
 * string.
 */
export const INTRO_BOOT_SCRIPT = `(function(){try{var d=document.documentElement,k=${JSON.stringify(INTRO_SEEN_KEY)};if(sessionStorage.getItem(k)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;sessionStorage.setItem(k,'1');d.setAttribute('data-intro','run');setTimeout(function(){d.removeAttribute('data-intro')},20000);document.addEventListener('click',function(e){var t=e.target;if(t&&t.closest&&t.closest('[data-intro-skip]'))d.removeAttribute('data-intro')},true)}catch(e){}})();`
