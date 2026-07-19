'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { useEffect, useState } from 'react'

import type { Theme } from '@/payload-types'
import { themeToCss } from '@/lib/theme'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

// Subscribes to the admin's Live Preview messages and re-injects the theme CSS
// as fields change, so colour edits show up in the preview iframe before saving.
// themeToCss is pure (type-only imports), so it runs the same on the client.
const PreviewStyle = ({ initialData }: { initialData: Theme }) => {
  const { data } = useLivePreview<Theme>({
    initialData,
    serverURL: SERVER_URL,
    depth: 0,
  })
  return <style dangerouslySetInnerHTML={{ __html: themeToCss(data) }} />
}

/**
 * Only mounts the live-preview listener when the page is running inside an
 * iframe (i.e. the admin preview). On the public site nothing renders and no
 * message listener is attached, so real visitors are completely unaffected.
 */
export const LivePreviewTheme = ({ initialData }: { initialData: Theme }) => {
  const [framed, setFramed] = useState(false)

  useEffect(() => {
    try {
      setFramed(window.self !== window.top)
    } catch {
      // Cross-origin framing throws on access — that still means we're framed.
      setFramed(true)
    }
  }, [])

  return framed ? <PreviewStyle initialData={initialData} /> : null
}
