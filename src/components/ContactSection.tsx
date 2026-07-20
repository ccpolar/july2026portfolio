import type { Contact } from '@/payload-types'

import { ContactForm } from './ContactForm'
import styles from './ContactSection.module.css'
import { NewsletterForm } from './NewsletterForm'

const Arrow = ({ className }: { className?: string }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M3 7h8M7.5 3.5 11 7l-3.5 3.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const ContactSection = ({ contact }: { contact: Contact }) => (
  <section className={styles.section} id="contact" aria-labelledby="contact-heading">
    <div className={`shell ${styles.grid}`}>
      <div>
        <h2 className={styles.heading} id="contact-heading">
          {contact.heading}
        </h2>
        {contact.blurb ? <p className={styles.blurb}>{contact.blurb}</p> : null}

        <ContactForm />

        <div className={styles.actions}>
          {contact.bookingUrl ? (
            <a
              className={styles.secondary}
              href={contact.bookingUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              Book a call
              <Arrow className={styles.arrow} />
            </a>
          ) : null}
          <a className={styles.emailFallback} href={`mailto:${contact.email}`}>
            or email {contact.email} directly
          </a>
        </div>
      </div>

      <div className={styles.aside}>
        {contact.newsletter?.enabled ? (
          <div>
            <h3 className={styles.asideTitle}>Not ready yet?</h3>
            {contact.newsletter.blurb ? (
              <p className={styles.asideBlurb}>{contact.newsletter.blurb}</p>
            ) : null}
            <NewsletterForm />
          </div>
        ) : null}

        {contact.socials?.length ? (
          <ul className={styles.socials}>
            {contact.socials.map((s) => (
              <li key={s.id ?? s.url}>
                <a
                  className={styles.social}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  </section>
)
