'use server'

import config from '@payload-config'
import { getPayload } from 'payload'

export type SubscribeState = {
  status: 'idle' | 'ok' | 'error'
  message: string
}

// Deliberately loose: the goal is to catch typos, not to police valid addresses.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

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

    return { status: 'ok', message: 'Thanks — I’ll be in touch when there’s something worth sharing.' }
  } catch {
    return {
      status: 'error',
      message: 'Something went wrong on my end. Email me directly and I’ll add you.',
    }
  }
}
