'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

import { type IntakeAnswers, submitIntake } from '@/app/(frontend)/actions'

import styles from './IntakeForm.module.css'

// Deliberately loose, matching the server: catches typos, doesn't police addresses.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const BUDGETS = ['<$5k', '$5k–15k', '$15k–40k', '$40k+']
const TIMELINES = ['ASAP', '1–3 months', '3–6 months', 'Flexible']

const EMPTY: IntakeAnswers = {
  name: '',
  email: '',
  company: '',
  website: '',
  services: [],
  budget: '',
  timeline: '',
  details: '',
  _gotcha: '',
}

type Kind = 'text' | 'email' | 'url' | 'textarea' | 'multi' | 'single'

type Step = {
  key: Exclude<keyof IntakeAnswers, '_gotcha'>
  kind: Kind
  heading: (a: IntakeAnswers) => string
  hint?: string
  placeholder?: string
  autoComplete?: string
  options?: string[]
  optional?: boolean
  valid: (a: IntakeAnswers) => boolean
}

const firstName = (a: IntakeAnswers) => a.name.trim().split(/\s+/)[0] ?? ''

const buildSteps = (services: string[]): Step[] => [
  {
    key: 'name',
    kind: 'text',
    heading: () => 'Let’s start with your name.',
    placeholder: 'Your name',
    autoComplete: 'name',
    valid: (a) => a.name.trim().length > 0,
  },
  {
    key: 'email',
    kind: 'email',
    heading: (a) => `Nice to meet you, ${firstName(a)}. Where can I reach you?`,
    placeholder: 'you@company.com',
    autoComplete: 'email',
    valid: (a) => EMAIL.test(a.email.trim()),
  },
  {
    key: 'company',
    kind: 'text',
    heading: () => 'What’s the company or project called?',
    placeholder: 'Company name',
    autoComplete: 'organization',
    valid: (a) => a.company.trim().length > 0,
  },
  {
    key: 'website',
    kind: 'url',
    heading: () => 'Is there a website I should look at?',
    hint: 'Optional — skip it if there isn’t one yet.',
    placeholder: 'yourcompany.com',
    autoComplete: 'url',
    optional: true,
    valid: () => true,
  },
  {
    key: 'services',
    kind: 'multi',
    heading: () => 'How can I help?',
    hint: 'Pick as many as fit.',
    options: services,
    valid: (a) => a.services.length > 0,
  },
  {
    key: 'budget',
    kind: 'single',
    heading: () => 'Roughly, what’s the budget?',
    options: BUDGETS,
    valid: (a) => Boolean(a.budget),
  },
  {
    key: 'timeline',
    kind: 'single',
    heading: () => 'When do you need it?',
    options: TIMELINES,
    valid: (a) => Boolean(a.timeline),
  },
  {
    key: 'details',
    kind: 'textarea',
    heading: () => 'Tell me about the project.',
    hint: 'What you’re making, what already exists, and anything I should know.',
    placeholder: 'A few sentences is plenty.',
    valid: (a) => a.details.trim().length > 0,
  },
]

type Phase = 'form' | 'sending' | 'error' | 'sent'

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M3 7.5 5.75 10 11 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Arrow = ({ back }: { back?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d={back ? 'M11 7H3M6.5 3.5 3 7l3.5 3.5' : 'M3 7h8M7.5 3.5 11 7l-3.5 3.5'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** How long the outgoing question takes to fade before the next one enters. */
const LEAVE_MS = 140

/**
 * The "Start a project" intake: one question per screen, answers held in a
 * single state object for the whole visit, sent to Formspree through the same
 * server helper as the site's other forms.
 */
export const IntakeForm = ({ services, onDone }: { services: string[]; onDone: () => void }) => {
  const steps = buildSteps(services)
  const total = steps.length

  const [answers, setAnswers] = useState<IntakeAnswers>(EMPTY)
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [leaving, setLeaving] = useState(false)
  const [phase, setPhase] = useState<Phase>('form')
  const [error, setError] = useState('')
  const [emailChecked, setEmailChecked] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement | null>(null)
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  const step = steps[index]
  const isLast = index === total - 1
  const valid = step.valid(answers)
  const skippable = Boolean(step.optional) && !String(answers[step.key] ?? '').trim()

  const focusField = useCallback(() => {
    const dialog = rootRef.current?.closest('dialog')
    if (dialog && !dialog.open) return
    ;(fieldRef.current ?? rootRef.current?.querySelector<HTMLElement>('h2'))?.focus()
  }, [])

  // Each new question (or result screen) takes focus, so keyboard and screen
  // reader users land on what just appeared rather than on the old button.
  useEffect(() => {
    if (!leaving) focusField()
  }, [index, phase, leaving, focusField])

  // Opening the dialog focuses the current question; closing it after a
  // successful send starts the next visit fresh, while closing mid-way keeps
  // every answer for when they come back.
  useEffect(() => {
    const dialog = rootRef.current?.closest('dialog')
    if (!dialog) return
    const observer = new MutationObserver(() => {
      if (dialog.open) requestAnimationFrame(focusField)
    })
    observer.observe(dialog, { attributes: true, attributeFilter: ['open'] })
    const onClose = () => {
      if (phaseRef.current !== 'sent') return
      setAnswers(EMPTY)
      setIndex(0)
      setEmailChecked(false)
      setError('')
      setPhase('form')
    }
    dialog.addEventListener('close', onClose)
    return () => {
      observer.disconnect()
      dialog.removeEventListener('close', onClose)
    }
  }, [focusField])

  const set = <K extends keyof IntakeAnswers>(key: K, value: IntakeAnswers[K]) =>
    setAnswers((prev) => ({ ...prev, [key]: value }))

  const goTo = (next: number, dir: 1 | -1) => {
    if (leaving) return
    // A failed send belongs to the last question; moving away clears it.
    if (phase === 'error') {
      setPhase('form')
      setError('')
    }
    setDirection(dir)
    if (prefersReducedMotion()) {
      setIndex(next)
      return
    }
    setLeaving(true)
    window.setTimeout(() => {
      setIndex(next)
      setLeaving(false)
    }, LEAVE_MS)
  }

  const send = async () => {
    setPhase('sending')
    setError('')
    try {
      const result = await submitIntake(answers)
      if (result.status === 'ok') {
        setPhase('sent')
      } else {
        setError(result.message)
        setPhase('error')
      }
    } catch {
      setError('That didn’t go through — check your connection. Your answers are still here.')
      setPhase('error')
    }
  }

  const advance = () => {
    if (phase === 'sending') return
    if (step.kind === 'email') setEmailChecked(true)
    if (!valid && !skippable) {
      // Pressing Continue too early would otherwise leave focus on the button,
      // so the next thing typed goes nowhere. Hand it back to the answer.
      focusField()
      return
    }
    if (isLast) {
      void send()
      return
    }
    goTo(index + 1, 1)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    advance()
  }

  const onTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      advance()
    }
  }

  const toggle = (option: string) => {
    if (step.kind === 'multi') {
      const current = answers.services
      set('services', current.includes(option) ? current.filter((o) => o !== option) : [...current, option])
    } else {
      set(step.key as 'budget' | 'timeline', option)
    }
  }

  const progress = phase === 'sent' ? 1 : index / total

  if (phase === 'sent') {
    return (
      <div className={styles.root} ref={rootRef}>
        <div className={styles.progress} aria-hidden="true">
          <span style={{ transform: 'scaleX(1)' }} />
        </div>
        <div className={styles.stage}>
          <div className={`${styles.step} ${styles.enterForward}`} key="sent">
            <h2 className={styles.heading} tabIndex={-1}>
              Thanks, {firstName(answers)}. I’ll be in touch shortly.
            </h2>
            <p className={styles.hint}>
              I read everything and reply within a day or two — even if it turns out not to be a fit.
            </p>
            <div className={styles.actions}>
              <button type="button" className={styles.continue} onClick={onDone}>
                Back to the site
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const emailError =
    step.kind === 'email' && emailChecked && answers.email.trim() && !valid
      ? 'That address looks incomplete — check it and try again.'
      : ''

  const continueLabel =
    phase === 'sending' ? 'Sending…' : isLast ? 'Send' : skippable ? 'Skip for now' : 'Continue'
  const inactive = (!valid && !skippable) || phase === 'sending'
  const isChoice = step.kind === 'multi' || step.kind === 'single'
  const fieldId = `intake-${step.key}`
  const hintId = step.hint ? `${fieldId}-hint` : undefined

  return (
    <div className={styles.root} ref={rootRef}>
      <div
        className={styles.progress}
        role="progressbar"
        aria-label="Progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={index}
        aria-valuetext={`Question ${index + 1} of ${total}`}
      >
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>

      <p className={styles.counter} aria-hidden="true">
        {index + 1} / {total}
      </p>

      <form className={styles.stage} onSubmit={onSubmit} noValidate>
        <div
          key={index}
          className={[
            styles.step,
            leaving ? (direction === 1 ? styles.leaveForward : styles.leaveBack) : direction === 1 ? styles.enterForward : styles.enterBack,
          ].join(' ')}
        >
          <h2 className={styles.heading} id={`${fieldId}-heading`} tabIndex={-1}>
            {isChoice ? step.heading(answers) : <label htmlFor={fieldId}>{step.heading(answers)}</label>}
          </h2>
          {step.hint ? (
            <p className={styles.hint} id={hintId}>
              {step.hint}
            </p>
          ) : null}

          {isChoice ? (
            <div
              className={styles.options}
              role="group"
              aria-labelledby={`${fieldId}-heading`}
              aria-describedby={hintId}
            >
              {step.options?.map((option, i) => {
                const selected =
                  step.kind === 'multi'
                    ? answers.services.includes(option)
                    : answers[step.key as 'budget' | 'timeline'] === option
                const firstFocusable = step.kind === 'single' ? (answers[step.key as 'budget' | 'timeline'] ? selected : i === 0) : i === 0
                return (
                  <button
                    key={option}
                    type="button"
                    className={styles.pill}
                    aria-pressed={selected}
                    onClick={() => toggle(option)}
                    ref={firstFocusable ? (el) => { fieldRef.current = el } : undefined}
                  >
                    {step.kind === 'multi' && selected ? <Check /> : null}
                    {option}
                  </button>
                )
              })}
            </div>
          ) : step.kind === 'textarea' ? (
            <textarea
              ref={(el) => { fieldRef.current = el }}
              id={fieldId}
              className={styles.textarea}
              value={answers.details}
              placeholder={step.placeholder}
              rows={5}
              aria-describedby={hintId}
              onChange={(e) => set('details', e.target.value)}
              onKeyDown={onTextareaKeyDown}
            />
          ) : (
            <input
              ref={(el) => { fieldRef.current = el }}
              id={fieldId}
              className={styles.input}
              type={step.kind === 'email' ? 'email' : step.kind === 'url' ? 'url' : 'text'}
              inputMode={step.kind === 'email' ? 'email' : step.kind === 'url' ? 'url' : undefined}
              value={String(answers[step.key] ?? '')}
              placeholder={step.placeholder}
              autoComplete={step.autoComplete}
              autoCapitalize={step.kind === 'text' ? 'words' : 'off'}
              spellCheck={step.kind === 'text'}
              aria-describedby={[hintId, emailError ? `${fieldId}-error` : undefined].filter(Boolean).join(' ') || undefined}
              aria-invalid={Boolean(emailError)}
              onChange={(e) => set(step.key, e.target.value as never)}
              onBlur={() => step.kind === 'email' && answers.email.trim() && setEmailChecked(true)}
            />
          )}

          {emailError ? (
            <p className={styles.fieldError} id={`${fieldId}-error`} role="alert">
              {emailError}
            </p>
          ) : null}

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.continue}
              aria-disabled={inactive}
              data-pending={phase === 'sending'}
            >
              {continueLabel}
              {!inactive && !isLast ? <Arrow /> : null}
            </button>
            {index > 0 ? (
              <button type="button" className={styles.back} onClick={() => goTo(index - 1, -1)}>
                <Arrow back />
                Back
              </button>
            ) : null}
            {step.kind === 'textarea' ? (
              <span className={styles.keyHint} aria-hidden="true">
                Ctrl/⌘ + Enter to send
              </span>
            ) : step.kind === 'multi' || step.kind === 'single' ? null : (
              <span className={styles.keyHint} aria-hidden="true">
                or press Enter ↵
              </span>
            )}
          </div>

          {phase === 'error' ? (
            <div className={styles.sendError} role="alert">
              <p>{error}</p>
              <button type="button" className={styles.retry} onClick={() => void send()}>
                Try again
              </button>
            </div>
          ) : null}

          {/* Hidden from people; a bot that fills every field trips it. */}
          <input
            className={styles.honeypot}
            type="text"
            name="_gotcha"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={answers._gotcha ?? ''}
            onChange={(e) => set('_gotcha', e.target.value)}
          />
        </div>
      </form>
    </div>
  )
}
