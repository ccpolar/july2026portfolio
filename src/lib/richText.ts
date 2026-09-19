/**
 * Whether a Lexical rich-text value holds any actual words. An editor that
 * was opened, typed into and cleared still saves a root with an empty
 * paragraph, so "has a value" isn't the same as "has something to show".
 */
export const hasText = (value: unknown): boolean => {
  const visit = (node: unknown): boolean => {
    if (!node || typeof node !== 'object') return false
    const { text, children } = node as { text?: unknown; children?: unknown }
    if (typeof text === 'string' && text.trim()) return true
    return Array.isArray(children) && children.some(visit)
  }
  return visit((value as { root?: unknown } | null | undefined)?.root)
}
