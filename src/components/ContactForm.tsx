'use client'

import { useActionState } from 'react'

import { type ContactState, submitContact } from '@/app/(frontend)/actions'

import styles from './ContactForm.module.css'

const initial: ContactState = { status: 'idle', message: '' }

export const ContactForm = () => {
  const [state, formAction, pending] = useActionState(submitContact, initial)

  return (
    <form className={styles.form} action={formAction} noValidate>
      <input
        className={styles.honeypot}
        type="text"
        name="_gotcha"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <label className="sr-only" htmlFor="contact-name">
        Name
      </label>
      <input
        className={styles.input}
        id="contact-name"
        name="name"
        type="text"
        autoComplete="name"
        placeholder="Your name"
        required
      />

      <label className="sr-only" htmlFor="contact-email">
        Email address
      </label>
      <input
        className={styles.input}
        id="contact-email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@studio.com"
        required
        aria-describedby={state.message ? 'contact-status' : undefined}
        aria-invalid={state.status === 'error'}
      />

      <label className="sr-only" htmlFor="contact-message">
        Message
      </label>
      <textarea
        className={styles.textarea}
        id="contact-message"
        name="message"
        rows={4}
        placeholder="What are you working on?"
        required
      />

      <button className={styles.submit} type="submit" disabled={pending} data-pending={pending}>
        {pending ? 'Sending…' : 'Send message'}
      </button>

      {state.message ? (
        <p
          // Remount on a new message so the entrance re-fires; without this
          // React reuses the node and a changed answer appears silently.
          key={state.message}
          className={`${styles.status} ${state.status === 'ok' ? styles.statusOk : styles.statusErr}`}
          id="contact-status"
          role="status"
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
