'use client'

import { useActionState, useId } from 'react'

import { type ContactState, submitContact } from '@/app/(frontend)/actions'

import styles from './ContactForm.module.css'

const initial: ContactState = { status: 'idle', message: '' }

export const ContactForm = () => {
  const [state, formAction, pending] = useActionState(submitContact, initial)
  // Renders twice on the homepage (inline in the contact section, and again
  // inside the popup) — a fixed id would collide, so every field id is
  // scoped to this instance.
  const id = useId()
  const nameId = `${id}-name`
  const emailId = `${id}-email`
  const messageId = `${id}-message`
  const statusId = `${id}-status`

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

      <label className="sr-only" htmlFor={nameId}>
        Name
      </label>
      <input
        className={styles.input}
        id={nameId}
        name="name"
        type="text"
        autoComplete="name"
        placeholder="Your name"
        required
      />

      <label className="sr-only" htmlFor={emailId}>
        Email address
      </label>
      <input
        className={styles.input}
        id={emailId}
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@studio.com"
        required
        aria-describedby={state.message ? statusId : undefined}
        aria-invalid={state.status === 'error'}
      />

      <label className="sr-only" htmlFor={messageId}>
        Message
      </label>
      <textarea
        className={styles.textarea}
        id={messageId}
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
          id={statusId}
          role="status"
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
