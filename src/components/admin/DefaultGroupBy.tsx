'use client'

import { useListQuery } from '@payloadcms/ui'
import { useEffect, useRef } from 'react'

/**
 * Opens a collection's list grouped, and then remembers what you chose.
 *
 * Payload can group a list by a field but has no setting for a default, so
 * the Work list used to open as one long mixed run of every project. This
 * opens it grouped by section the first time, and from then on restores
 * whatever was last chosen — grouped, grouped by something else, or not
 * grouped at all.
 *
 * It keeps that choice itself, in this browser, rather than leaning on
 * Payload's own saved list settings. The first version did lean on them, on
 * the assumption that a deliberate "no grouping" would be saved as an empty
 * value distinguishable from "never chosen". It isn't — after pressing Clear
 * the two look identical — so the default kept coming back and overriding the
 * choice. Remembering it here is the only way to tell them apart.
 */
export const DefaultGroupBy = ({
  field = 'category',
  storageKey = 'campagano:admin-groupby:projects',
}: {
  field?: string
  storageKey?: string
}) => {
  const { query, refineListData } = useListQuery()
  const current = typeof query?.groupBy === 'string' ? query.groupBy : ''
  const skipFirstRecord = useRef(true)

  // On arrival: restore the last choice, defaulting to grouped if there has
  // never been one. An empty choice means "not grouped" and is left alone.
  useEffect(() => {
    let intent: string | null = null
    try {
      intent = localStorage.getItem(storageKey)
    } catch {
      /* storage blocked — fall back to the default for this visit */
    }
    if (intent === null) {
      intent = field
      try {
        localStorage.setItem(storageKey, field)
      } catch {
        /* storage blocked */
      }
    }
    if (intent && current !== intent && typeof refineListData === 'function') {
      void refineListData({ groupBy: intent, page: 1 })
    }
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Afterwards: whatever the grouping becomes is what to restore next time.
  // Skips its first run, which fires on arrival with the value from before
  // the restore above has landed — recording that would overwrite the choice
  // that was just restored.
  useEffect(() => {
    if (skipFirstRecord.current) {
      skipFirstRecord.current = false
      return
    }
    try {
      localStorage.setItem(storageKey, current)
    } catch {
      /* storage blocked */
    }
  }, [current, storageKey])

  return null
}
