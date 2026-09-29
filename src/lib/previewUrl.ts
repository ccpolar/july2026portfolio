import type { PayloadRequest } from 'payload'

/**
 * The origin the admin is being served from, taken from the request itself.
 *
 * Live preview needs an absolute URL, and it has to be the *right* one: the
 * admin posts each keystroke to the preview frame with this as the target
 * origin, so a mismatch means the frame loads nothing or receives nothing. A
 * fixed value can't be right everywhere — campagano.com redirects to www, and
 * an unset NEXT_PUBLIC_SERVER_URL would point the pane at localhost. Reading
 * it from the request covers the live site, Vercel's preview deployments and
 * local development without configuration.
 */
export const adminOrigin = (req?: Partial<PayloadRequest>): string => {
  const headers = req?.headers

  const origin = headers?.get('origin')
  if (origin) return origin

  const host = headers?.get('x-forwarded-host') ?? headers?.get('host')
  if (host) {
    const forwardedProto = headers?.get('x-forwarded-proto')
    const proto = forwardedProto ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? 'http' : 'https')
    return `${proto}://${host}`
  }

  return process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
}
