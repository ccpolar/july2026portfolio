'use client'

import { useEffect, useMemo } from 'react'

import ColorPicker from './color-picker'
import './color-picker.css'
import './color-picker.theme.css'

/**
 * One Colorify picker for the whole page, shared by every tool on it.
 *
 * The picker takes its onChange and onClose once, when it's made, so each
 * opening is a "session" with its own pair: the tool that opened it hears
 * the changes, and hears the close. Opening it for something else first
 * closes the session in progress, so its owner always gets to commit.
 *
 * It's made when the first tool mounts and taken off the page when the last
 * one goes.
 */

type Session = {
  /** Every change, live, as lowercase hex. */
  onChange: (hex: string) => void
  /** The colour it closed on, and whether that differs from where it began. */
  onClose: (hex: string, changed: boolean) => void
}

let instance: ColorPicker | null = null
let users = 0
let session: (Session & { from: string; anchor: HTMLElement }) | null = null

const create = () =>
  new ColorPicker({
    onChange: (color) => session?.onChange(color.hex.toLowerCase()),
    onClose: (color) => {
      const ending = session
      session = null
      if (!ending) return
      const hex = color.hex.toLowerCase()
      ending.onClose(hex, hex !== ending.from)
      // Closed from inside (Esc, the × button): back to what opened it, so
      // the keyboard doesn't lose its place.
      if (instance?.el.contains(document.activeElement)) ending.anchor.focus()
    },
  })

export const useColorPicker = () => {
  useEffect(() => {
    users++
    if (!instance) instance = create()
    return () => {
      users--
      if (users > 0 || !instance) return
      session = null
      instance.close()
      instance.el.remove()
      instance = null
    }
  }, [])

  return useMemo(
    () => ({
      /** Opens the picker beside `anchor` on `hex`, or closes it if it's
       *  already open for that same anchor. */
      toggle(anchor: HTMLElement, hex: string, handlers: Session) {
        if (!instance) return
        if (instance.isOpen && session?.anchor === anchor) {
          instance.close()
          return
        }
        if (instance.isOpen) instance.close()
        const from = hex.toLowerCase()
        session = { ...handlers, from, anchor }
        instance.open(anchor, from)
      },
      close() {
        instance?.close()
      },
    }),
    [],
  )
}
