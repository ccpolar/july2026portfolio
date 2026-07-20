'use client'

import { useRef } from 'react'

import { CONTACT_MODAL_ID } from '@/lib/contactModal'

import { ContactForm } from './ContactForm'
import styles from './ContactModal.module.css'

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M4 4l8 8M12 4l-8 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

export const ContactModal = ({ heading }: { heading: string }) => {
  const ref = useRef<HTMLDialogElement>(null)

  // Clicking the dimmed backdrop reads as target === the dialog itself (its
  // content box, not the backdrop, is what has a bounding rect) — so a click
  // landing outside that rect is the backdrop, and light-dismiss should close it.
  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    if (!inside) ref.current?.close()
  }

  return (
    <dialog
      id={CONTACT_MODAL_ID}
      ref={ref}
      className={styles.dialog}
      aria-labelledby="contact-modal-heading"
      onClick={handleBackdropClick}
    >
      <button
        type="button"
        className={styles.close}
        onClick={() => ref.current?.close()}
        aria-label="Close"
      >
        <CloseIcon />
      </button>
      <h2 className={styles.heading} id="contact-modal-heading">
        {heading}
      </h2>
      <ContactForm />
    </dialog>
  )
}
