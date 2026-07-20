import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
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
