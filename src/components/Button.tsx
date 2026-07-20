import React from 'react'

import styles from './Button.module.css'

const Arrow = () => (
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
)

type LinkProps = {
  href: string
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
  withArrow?: boolean
}

export const ButtonLink = ({ href, variant = 'primary', children, withArrow }: LinkProps) => {
  const external = href.startsWith('http')

  return (
    <a
      className={`${styles.base} ${styles[variant]}`}
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
    >
      {children}
      {withArrow ? <Arrow /> : null}
    </a>
  )
}

type ButtonProps = {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
  withArrow?: boolean
  onClick?: () => void
}

/**
 * Same visual system as ButtonLink, for CTAs that trigger behavior (opening
 * the contact popup) instead of navigating.
 */
export const Button = ({ variant = 'primary', children, withArrow, onClick }: ButtonProps) => (
  <button type="button" className={`${styles.base} ${styles[variant]}`} onClick={onClick}>
    {children}
    {withArrow ? <Arrow /> : null}
  </button>
)
