import { countPublishedPosts, getContact, getLegal, getServices } from '@/lib/data'
import { hasText } from '@/lib/richText'

import { MountainIllustration } from './MountainIllustration'
import { NewsletterForm } from './NewsletterForm'
import styles from './SiteFooter.module.css'

type FooterLink = { label: string; href: string }

const DEFAULT_TAGLINE =
  'Here to help founders reach their creative goals and fulfill their visual dreams.'

const Link = ({ label, href }: FooterLink) =>
  /^https?:\/\//.test(href) ? (
    <a className={styles.link} href={href} target="_blank" rel="noreferrer noopener">
      {label}
    </a>
  ) : (
    <a className={styles.link} href={href}>
      {label}
    </a>
  )

/**
 * The close of every page: a linocut mountain scene in the theme's own
 * colours, with the name and tagline, the newsletter for anyone not ready to
 * reach out, and three columns of ways onward. Reads its own content, so each
 * page only passes the site name.
 *
 * Every column is driven from /admin: services are the live homepage cards,
 * socials come from Contact, Blog appears once a post is published (as in the
 * header), and each legal link appears once its page has text.
 */
export const SiteFooter = async ({ siteName }: { siteName: string }) => {
  const [contact, services, legal, postCount] = await Promise.all([
    getContact(),
    getServices(),
    getLegal(),
    countPublishedPosts(),
  ])

  const newsletter = contact.newsletter?.enabled ? contact.newsletter : null
  const tagline = contact.footerTagline?.trim() || DEFAULT_TAGLINE

  const columns: { heading: string; links: FooterLink[] }[] = [
    {
      heading: 'Services',
      // The same switch as the homepage, so the two lists never disagree.
      links: services
        .filter((service) => service.published !== false)
        .map((service) => ({ label: service.title, href: '/#services' })),
    },
    {
      heading: 'Pages',
      links: [
        { label: 'Moodboard', href: '/moodboard' },
        { label: 'Snippets', href: '/snippets' },
        ...(postCount > 0 ? [{ label: 'Blog', href: '/blog' }] : []),
        { label: 'Recent Work', href: '/work' },
        { label: 'All Work', href: '/portfolio' },
      ],
    },
    {
      heading: 'Socials',
      links: (contact.socials ?? []).map((s) => ({ label: s.label, href: s.url })),
    },
  ].filter((column) => column.links.length)

  const legalLinks: FooterLink[] = [
    ...(hasText(legal.terms) ? [{ label: 'Terms of Service', href: '/terms' }] : []),
    ...(hasText(legal.privacy) ? [{ label: 'Privacy Policy', href: '/privacy' }] : []),
  ]

  return (
    <footer className={styles.footer} style={{ viewTransitionName: 'site-footer' }}>
      <div className={styles.art}>
        <MountainIllustration className={styles.illustration} />
      </div>

      <div className={styles.inner}>
        <div className={styles.brand}>
          <a className={styles.wordmark} href="/" aria-label={`${siteName}, home`}>
            <svg className={styles.mark} viewBox="0 0 97 28.313" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="M96.982 11.929h0c0 6.588-5.4 11.928-12.061 11.928h-23.952c-0.235 0-0.427 0.188-0.427 0.422v3.293c0 0.238-0.195 0.43-0.435 0.431h-10.785c-0.228 0-0.414-0.183-0.413-0.409v-14.8c0-0.244 0.2-0.441 0.445-0.441h35.566c0.236 0 0.428-0.19 0.427-0.423h0c0-0.234-0.192-0.423-0.427-0.424H12.043c-0.236 0-0.428 0.19-0.428 0.424h0c0 0.234 0.192 0.423 0.428 0.423h35.565c0.247 0 0.446 0.198 0.446 0.441v10.655c0 0.225-0.185 0.409-0.414 0.409H12.043C5.382 23.856-0.018 18.516-0.018 11.929h0C-0.018 5.341 5.382 0 12.043 0h72.878c6.661 0 12.061 5.341 12.061 11.929Z"
              />
            </svg>
            <span className={styles.name}>{siteName}</span>
          </a>

          <p className={styles.tagline}>{tagline}</p>

          {newsletter ? (
            <div className={styles.newsletter}>
              {newsletter.blurb ? <p className={styles.newsletterNote}>{newsletter.blurb}</p> : null}
              <NewsletterForm />
            </div>
          ) : null}
        </div>

        <nav className={styles.columns} aria-label="Footer">
          {columns.map((column) => (
            <div className={styles.column} key={column.heading}>
              <h2 className={styles.heading}>{column.heading}</h2>
              <ul className={styles.list}>
                {column.links.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    <Link {...link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className={styles.legal}>
        <p className={styles.copyright}>
          © {new Date().getFullYear()} Polar Creative Group. All rights reserved.
        </p>
        {legalLinks.length ? (
          <ul className={styles.legalLinks}>
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link {...link} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </footer>
  )
}
