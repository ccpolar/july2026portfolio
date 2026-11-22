import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't announce the framework in every response.
  poweredByHeader: false,
  // Standard protections on every response: no other site may frame these
  // pages (the Toolbox frames its own), browsers mustn't guess file types,
  // and links out don't carry the full address of the page they came from.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },
  // Payload calls sharp directly (image resizing on upload), which Next.js's
  // build-time file tracer doesn't always follow correctly since it's a
  // dynamic require rather than a static import. When sharp's native binary
  // is left out of the deployed function, it silently falls back to its
  // WASM build — which returns buffers backed by a SharedArrayBuffer, and
  // Vercel Blob's upload rejects those outright. Documented fix, straight
  // from Next.js's own docs: https://nextjs.org/docs/app/api-reference/config/next-config-js/output
  outputFileTracingIncludes: {
    '/*': ['node_modules/sharp/**/*', 'node_modules/@img/**/*'],
  },
}

export default withPayload(nextConfig)
