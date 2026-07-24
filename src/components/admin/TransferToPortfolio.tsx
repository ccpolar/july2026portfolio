'use client'

import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { useState } from 'react'

import styles from './TransferToPortfolio.module.css'

type Category = {
  slug: 'branding' | 'merchandise' | 'advertising' | 'websites'
  label: string
  // Which upload field the category stores its image in.
  imageField: 'image' | 'screenshot'
}

const CATEGORIES: Category[] = [
  { slug: 'branding', label: 'Branding', imageField: 'image' },
  { slug: 'merchandise', label: 'Merchandise', imageField: 'image' },
  { slug: 'advertising', label: 'Advertising', imageField: 'image' },
  { slug: 'websites', label: 'Website', imageField: 'screenshot' },
]

type Result = { slug: string; ok: boolean; message: string }

/**
 * A UI-only control on the project edit page: copies this project's cover image
 * and title into any of the four portfolio categories with one click. It reads
 * the live form values (so it works before or after saving, as long as a cover
 * is chosen) and POSTs to the category's REST endpoint with the admin session
 * cookie. The project itself is untouched — this is a copy, not a move.
 */
export const TransferToPortfolio = () => {
  const { title, cover } = useFormFields(([fields]) => ({
    title: fields?.title?.value as string | undefined,
    cover: fields?.cover?.value as number | { id: number } | undefined,
  }))
  // The saved project's own id — present once it exists, so a branding copy can
  // link back to it and become clickable on the portfolio page.
  const { id: projectId } = useDocumentInfo()

  const coverId =
    cover && typeof cover === 'object' ? cover.id : typeof cover === 'number' ? cover : undefined

  const [busy, setBusy] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  const transfer = async (category: Category) => {
    if (!coverId) return
    setBusy(category.slug)
    setResult(null)
    try {
      const res = await fetch(`/api/${category.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: (title && title.trim()) || 'Untitled',
          [category.imageField]: coverId,
          // Only branding carries a project link; setting it makes the copied
          // thumbnail clickable straight through to this project's case study.
          ...(category.slug === 'branding' && projectId ? { project: projectId } : {}),
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setResult({ slug: category.slug, ok: true, message: `Copied into ${category.label}.` })
    } catch {
      setResult({
        slug: category.slug,
        ok: false,
        message: `Couldn’t copy into ${category.label} — try again.`,
      })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>Add to portfolio</p>
      <p className={styles.help}>
        Copies this project’s cover image and title into a portfolio category. The project stays
        here in Recent Work — this only adds a copy.
      </p>

      {coverId ? (
        <div className={styles.buttons}>
          {CATEGORIES.map((category) => (
            <button
              key={category.slug}
              type="button"
              className={styles.btn}
              disabled={busy !== null}
              onClick={() => transfer(category)}
            >
              {busy === category.slug ? 'Adding…' : `+ ${category.label}`}
            </button>
          ))}
        </div>
      ) : (
        <p className={styles.hint}>Choose a cover image above first, then you can copy it across.</p>
      )}

      {result ? (
        <p className={result.ok ? styles.ok : styles.err}>{result.message}</p>
      ) : null}
    </div>
  )
}

export default TransferToPortfolio
