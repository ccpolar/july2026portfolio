'use client'

import type React from 'react'

import { openContactModal } from '@/lib/contactModal'

import { Button } from './Button'

type Props = {
  variant?: 'primary' | 'secondary'
  withArrow?: boolean
  children: React.ReactNode
}

/**
 * Opens the shared contact dialog. A separate client component so Hero
 * (server-rendered, fetching its own content) doesn't need to become one
 * just for this button's onClick.
 */
export const OpenContactButton = ({ variant, withArrow, children }: Props) => (
  <Button variant={variant} withArrow={withArrow} onClick={openContactModal}>
    {children}
  </Button>
)
