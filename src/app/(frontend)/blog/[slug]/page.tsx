import config from '@payload-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPayload } from 'payload'
import { cache } from 'react'

import { MediaImage } from '@/components/MediaImage'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { getChrome } from '@/lib/chrome'
import { formatDate } from '@/lib/format'
import { postTransitionName } from '@/lib/viewTransition'

import styles from './page.module.css'

type Params = { params: Promise<{ slug: string }> }

// The published filter is explicit here because the local API bypasses access
// control — without it a draft would render for anyone who guessed the URL.
const getPost = cache(async (slug: string) => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'posts',
    where: { and: [{ slug: { equals: slug } }, { published: { equals: true } }] },
    depth: 1,
    limit: 1,
  })
  return docs[0] ?? null
})

export async function generateStaticParams() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'posts',
    where: { published: { equals: true } },
    depth: 0,
    limit: 100,
  })
  return docs.filter((d) => d.slug).map((d) => ({ slug: d.slug as string }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Not found' }

  const chrome = await getChrome()
  return {
    title: `${post.title} — ${chrome.siteName}`,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: 'article' },
  }
}

const BackArrow = () => (
  <svg
    className={styles.backArrow}
    width="13"
    height="13"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M11 7H3M6.5 3.5 3 7l3.5 3.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default async function PostPage({ params }: Params) {
  const { slug } = await params
  const [post, chrome] = await Promise.all([getPost(slug), getChrome()])

  if (!post) notFound()

  return (
    <>
      <SiteHeader {...chrome} />
      <main>
        <div className={`shell ${styles.header}`}>
          <a className={styles.back} href="/blog">
            <BackArrow />
            All posts
          </a>
          <time className={styles.date} dateTime={post.publishedAt}>
            {formatDate(post.publishedAt)}
          </time>
          <h1 className={styles.title}>{post.title}</h1>
          <p className={styles.lede}>{post.excerpt}</p>
        </div>

        {post.cover && typeof post.cover === 'object' ? (
          <div className={`shell ${styles.cover}`}>
            <div
              className={styles.frame}
              style={{ viewTransitionName: postTransitionName(post.slug) }}
            >
              <MediaImage
                className={styles.image}
                media={post.cover}
                priority
                sizes="(min-width: 88rem) 88rem, 100vw"
              />
            </div>
          </div>
        ) : null}

        <div className={`shell ${styles.body}`}>
          <div className={styles.prose}>
            <RichText data={post.body} />
          </div>
        </div>
      </main>
      <SiteFooter siteName={chrome.siteName} />
    </>
  )
}
