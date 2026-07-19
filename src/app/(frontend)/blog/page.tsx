import type { Metadata } from 'next'

import { MediaImage } from '@/components/MediaImage'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { getChrome } from '@/lib/chrome'
import { getHomepage, getPublishedPosts } from '@/lib/data'
import { formatDate } from '@/lib/format'
import { postTransitionName } from '@/lib/viewTransition'

import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const [home, chrome] = await Promise.all([getHomepage(), getChrome()])
  const heading = home.blogHeading ?? 'Blog'
  return {
    title: `${heading} — ${chrome.siteName}`,
    description: home.blogIntro ?? undefined,
  }
}

export default async function BlogPage() {
  const [home, chrome, posts] = await Promise.all([
    getHomepage(),
    getChrome(),
    getPublishedPosts(),
  ])

  return (
    <>
      <SiteHeader {...chrome} />
      <main>
        <div className={`shell ${styles.head}`}>
          <h1 className={styles.heading}>{home.blogHeading ?? 'Blog'}</h1>
          {home.blogIntro ? <p className={styles.intro}>{home.blogIntro}</p> : null}
        </div>

        {posts.length ? (
          <ul className={`shell ${styles.list}`}>
            {posts.map((post) => (
              <li key={post.id}>
                <a className={styles.row} href={`/blog/${post.slug}`}>
                  <div>
                    <time className={styles.date} dateTime={post.publishedAt}>
                      {formatDate(post.publishedAt)}
                    </time>
                    <h2 className={styles.title}>{post.title}</h2>
                    <p className={styles.excerpt}>{post.excerpt}</p>
                  </div>
                  {post.cover && typeof post.cover === 'object' ? (
                    <div
                      className={styles.thumb}
                      style={{ viewTransitionName: postTransitionName(post.slug) }}
                    >
                      <MediaImage
                        className={styles.thumbImg}
                        media={post.cover}
                        sizes="(min-width: 52rem) 16rem, 100vw"
                      />
                    </div>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className={`shell ${styles.empty}`}>
            Nothing published here yet — the first post is on its way.
          </p>
        )}
      </main>
      <SiteFooter siteName={chrome.siteName} />
    </>
  )
}
