'use server'

import config from '@payload-config'
import { getPayload } from 'payload'

export type SubscribeState = {
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

export type IntakeAnswers = {
  name: string
  email: string
  company: string
  website: string
  services: string[]
  budget: string
  timeline: string
  details: string
  /** Honeypot — hidden from people, filled by bots. */
  _gotcha?: string
}

export type IntakeResult = { status: 'ok' } | { status: 'error'; message: string }

/**
 * The multi-step "Start a project" intake. Every step is validated in the
 * browser, but the request can be replayed without the UI, so the same rules
 * are enforced again here before anything reaches Formspree.
 */
export async function submitIntake(answers: IntakeAnswers): Promise<IntakeResult> {
  if (String(answers._gotcha ?? '').trim()) return { status: 'ok' }

  const clean = (value: unknown, max = 2000) => String(value ?? '').trim().slice(0, max)
  const name = clean(answers.name, 120)
  const email = clean(answers.email, 200).toLowerCase()
  const company = clean(answers.company, 160)
  const website = clean(answers.website, 300)
  const services = Array.isArray(answers.services)
    ? answers.services.map((s) => clean(s, 80)).filter(Boolean)
    : []
  const budget = clean(answers.budget, 40)
  const timeline = clean(answers.timeline, 40)
  const details = clean(answers.details, 5000)

  if (!name || !company || !services.length || !budget || !timeline || !details) {
    return { status: 'error', message: 'A step is missing an answer — go back and check.' }
  }
  if (!EMAIL.test(email)) {
    return { status: 'error', message: 'That email looks incomplete — go back and check it.' }
  }

  const endpoint = process.env.FORMSPREE_CONTACT_ENDPOINT
  if (!endpoint) return { status: 'error', message: GENERIC_ERROR }

  try {
    await postToFormspree(endpoint, {
      name,
      email,
      company,
      website: website || '—',
      services: services.join(', '),
      budget,
      timeline,
      details,
      _subject: `New project: ${company}`,
      _replyto: email,
    })
    return { status: 'ok' }
  } catch {
    return { status: 'error', message: 'That didn’t go through — nothing you did. Your answers are still here.' }
  }
}
