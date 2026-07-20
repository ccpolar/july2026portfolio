'use server'

import config from '@payload-config'
import { getPayload } from 'payload'

export type SubscribeState = {
  status: 'idle' | 'ok' | 'error'
  message: string
}

export type ContactState = {
  status: 'idle' | 'ok' | 'error'
  message: string
}

// Deliberately loose: the goal is to catch typos, not to police valid addresses.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const GENERIC_ERROR = 'Something went wrong on my end. Email me directly and I’ll get back to you.'

async function postToFormspree(endpoint: string, data: Record<string, string>) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Formspree responded ${res.status}`)
}

export async function subscribe(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()

  if (!email) {
    return { status: 'error', message: 'Enter your email address.' }
  }

  if (!EMAIL.test(email)) {
    return { status: 'error', message: 'That address looks incomplete — check it and try again.' }
  }

  try {
    const payload = await getPayload({ config })

    const existing = await payload.find({
      collection: 'subscribers',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    })

    // Already subscribed is a success from the visitor's point of view; telling
    // them otherwise just makes them wonder what went wrong.
    if (existing.docs.length) {
      return { status: 'ok', message: 'You’re already on the list — thanks.' }
    }

    await payload.create({
      collection: 'subscribers',
      data: { email, source: 'homepage' },
      overrideAccess: true,
    })

    // Payload is the system of record for subscribers — a Formspree hiccup
    // here is a missed notification, not a failed signup, so it stays silent.
    const formspreeEndpoint = process.env.FORMSPREE_NEWSLETTER_ENDPOINT
    if (formspreeEndpoint) {
      try {
        await postToFormspree(formspreeEndpoint, { email, source: 'homepage' })
      } catch {
        // ignored — see comment above
      }
    }

    return { status: 'ok', message: 'Thanks — I’ll be in touch when there’s something worth sharing.' }
  } catch {
    return {
      status: 'error',
      message: 'Something went wrong on my end. Email me directly and I’ll add you.',
    }
  }
}

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Hidden field real visitors never see or fill; a bot that fills every
  // field trips it. Formspree does the same thing under the field name
  // `_gotcha` — pretend success without sending anything.
  if (String(formData.get('_gotcha') ?? '').trim()) {
    return { status: 'ok', message: 'Thanks — I’ll get back to you soon.' }
  }

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const message = String(formData.get('message') ?? '').trim()

  if (!name || !email || !message) {
    return { status: 'error', message: 'Fill in your name, email, and a message.' }
  }

  if (!EMAIL.test(email)) {
    return { status: 'error', message: 'That address looks incomplete — check it and try again.' }
  }

  const endpoint = process.env.FORMSPREE_CONTACT_ENDPOINT
  if (!endpoint) {
    return { status: 'error', message: GENERIC_ERROR }
  }

  try {
    await postToFormspree(endpoint, { name, email, message })
    return { status: 'ok', message: 'Thanks — I’ll get back to you soon.' }
  } catch {
    return { status: 'error', message: GENERIC_ERROR }
  }
}
