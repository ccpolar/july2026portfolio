import { getContact } from '@/lib/data'

import { NewsletterForm } from './NewsletterForm'
import styles from './SiteFooter.module.css'

/**
 * The close of every page: a quiet way to stay in touch for anyone not ready
 * to reach out (bottom left), and where else to find Cam (bottom right).
 * Reads its own content, so each page only passes the site name.
 */
export const SiteFooter = async ({ siteName }: { siteName: string }) => {
  const contact = await getContact()
  const newsletter = contact.newsletter?.enabled ? contact.newsletter : null
  const socials = contact.socials ?? []

  return (
    <footer className={styles.footer} style={{ viewTransitionName: 'site-footer' }}>
      <div className={`shell ${styles.inner}`}>
        {newsletter ? (
          <div className={styles.newsletter}>
            <p className={styles.title}>Not ready yet?</p>
            {newsletter.blurb ? <p className={styles.blurb}>{newsletter.blurb}</p> : null}
            <NewsletterForm />
          </div>
        ) : null}

        <div className={styles.meta}>
          {socials.length ? (
            <ul className={styles.socials}>
              {socials.map((s) => (
                <li key={s.id ?? s.url}>
                  <a className={styles.social} href={s.url} target="_blank" rel="noreferrer noopener">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          <p className={styles.legal}>
            <span className={styles.name}>{siteName}</span>
            <span>© {new Date().getFullYear()}</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
