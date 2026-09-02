'use client'

import { useEffect } from 'react'

/**
 * Closes the casual save routes on the artwork: right-click → "Save image as",
 * long-press → "Save Image" on iOS, and dragging a picture out to the desktop.
 * Scoped to images, so right-clicking text or a link still behaves normally,
 * and mounted on the public site only — /admin keeps its full context menu.
 *
 * Worth being clear-eyed about: this is a deterrent, not protection. The
 * browser has already downloaded every image it displays, so the file URL,
 * devtools, and a screenshot all remain open to anyone who looks. It stops the
 * reflex grab and nothing more — genuinely protecting work means watermarking
 * it or not publishing it at full resolution.
 */
export const NoImageDownloads = () => {
  useEffect(() => {
    const block = (e: Event) => {
      const target = e.target
      if (target instanceof Element && target.closest('img, picture')) e.preventDefault()
    }

    document.addEventListener('contextmenu', block)
    document.addEventListener('dragstart', block)
    return () => {
      document.removeEventListener('contextmenu', block)
      document.removeEventListener('dragstart', block)
    }
  }, [])

  return null
}
