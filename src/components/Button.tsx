import React from 'react'

import styles from './Button.module.css'

type Props = {
  href: string
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
  withArrow?: boolean
}

export const ButtonLink = ({ href, variant = 'primary', children, withArrow }: Props) => {
  const external = href.startsWith('http')

  return (
    <a
      className={`${styles.base} ${styles[variant]}`}
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
    >
      {children}
      {withArrow ? (
        <svg
          className={styles.arrow}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 7h8M7.5 3.5 11 7l-3.5 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </a>
  )
}
