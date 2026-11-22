'use client'

import { useActionState } from 'react'

import { type SubscribeState, subscribe } from '@/app/(frontend)/actions'

import styles from './NewsletterForm.module.css'

const initial: SubscribeState = { status: 'idle', message: '' }

export const NewsletterForm = () => {
  const [state, formAction, pending] = useActionState(subscribe, initial)

  return (
    <form className={styles.form} action={formAction} noValidate>
      <label className="sr-only" htmlFor="newsletter-email">
        Email address
      </label>
      <input
        className={styles.input}
        id="newsletter-email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@studio.com"
        required
        aria-describedby={state.message ? 'newsletter-status' : undefined}
        aria-invalid={state.status === 'error'}
      />
      {/* Honeypot: off-screen and skipped by keyboard and screen readers, so
          only a bot filling in every field puts anything here. */}
      <input
        type="text"
        name="_gotcha"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />
      <button className={styles.submit} type="submit" disabled={pending} data-pending={pending}>
        {pending ? 'Adding…' : 'Keep me posted'}
      </button>
      {state.message ? (
        <p
          // Remount on a new message so the entrance re-fires; without this
          // React reuses the node and a changed answer appears silently.
          key={state.message}
          className={`${styles.status} ${state.status === 'ok' ? '' : styles.statusErr}`}
          id="newsletter-status"
          role="status"
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
