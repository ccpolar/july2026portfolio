/** Bits both tools use: where they keep their last state, how one hands
 *  colours to the other, and a copy that reports whether it worked. */

export const STORAGE = { mesh: 'toolbox:mesh', palette: 'toolbox:palette', grid: 'toolbox:grid' } as const

/** Fired on window by the palette tool; detail is an array of hex colours. */
export const USE_COLORS_EVENT = 'toolbox:use-colors'

// Storage can be switched off or full (private windows, strict settings);
// the tools work the same without it, they just start from the default.
export const readStored = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export const writeStored = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* nothing to do */
  }
}

export const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Older browsers, and pages without clipboard permission.
    try {
      const area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand('copy')
      area.remove()
      return ok
    } catch {
      return false
    }
  }
}
