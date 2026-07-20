/**
 * Resolves a CSS colour expression — a var() chain, a literal hex, anything
 * valid as a CSS <color> — to the browser's fully computed value, e.g.
 * "var(--signal)" -> "oklch(0.8 0.17 113)". Needed because <canvas> can't
 * parse var() itself; it only accepts an already-resolved colour string, and
 * a custom property's raw value doesn't recursively resolve nested var()s
 * the way an actual applied property does.
 */
export const resolveCssColor = (expression: string): string => {
  const probe = document.createElement('span')
  probe.style.color = expression
  document.body.appendChild(probe)
  const resolved = getComputedStyle(probe).color
  document.body.removeChild(probe)
  return resolved
}
