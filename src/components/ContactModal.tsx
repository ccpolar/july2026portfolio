'use client'

import { useRef } from 'react'

import { CONTACT_MODAL_ID } from '@/lib/contactModal'

import styles from './ContactModal.module.css'
import { IntakeForm } from './IntakeForm'

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

/**
 * The "Start a project" overlay, opened by the hero button and the nav's mail
 * tile. Full-viewport, so the intake gets the whole screen; Escape closes it
 * natively, and answers survive closing it mid-way.
 */
export const ContactModal = ({ services }: { services: string[] }) => {
  const ref = useRef<HTMLDialogElement>(null)
  const close = () => ref.current?.close()

  return (
    <dialog id={CONTACT_MODAL_ID} ref={ref} className={styles.dialog} aria-label="Start a project">
      <IntakeForm services={services} onDone={close} />
      {/* After the form in the DOM so opening the dialog lands on the question,
          not on Close; it's still placed top-right visually. */}
      <button type="button" className={styles.close} onClick={close} aria-label="Close">
        <CloseIcon />
      </button>
    </dialog>
  )
}
