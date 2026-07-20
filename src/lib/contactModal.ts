export const CONTACT_MODAL_ID = 'contact-modal'

/**
 * The header's "Get in touch" and the hero's "Start a project" both open the
 * same dialog (mounted once in the frontend layout) rather than each holding
 * their own open state — a plain id lookup avoids wiring a context provider
 * through two otherwise-unrelated components just to share one boolean.
 */
export const openContactModal = () => {
  const dialog = document.getElementById(CONTACT_MODAL_ID)
  if (dialog instanceof HTMLDialogElement) dialog.showModal()
}
