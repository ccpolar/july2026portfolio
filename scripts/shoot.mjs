import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const OUT = process.env.SHOT_DIR ?? './.shots'
const BASE = process.env.BASE_URL ?? 'http://localhost:3000'

const targets = [
  { name: 'desktop-home', path: '/', width: 1440, height: 1000, full: true },
  { name: 'desktop-home-fold', path: '/', width: 1440, height: 900, full: false },
  { name: 'tablet-home', path: '/', width: 820, height: 1100, full: true },
  { name: 'mobile-home', path: '/', width: 390, height: 844, full: true },
  { name: 'mobile-fold', path: '/', width: 390, height: 844, full: false },
  { name: 'desktop-project', path: '/work/fold-coffee', width: 1440, height: 1000, full: true },
  { name: 'mobile-project', path: '/work/fold-coffee', width: 390, height: 844, full: true },
]

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
const problems = []

for (const t of targets) {
  const ctx = await browser.newContext({
    viewport: { width: t.width, height: t.height },
    deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()

  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`[console:${t.name}] ${m.text()}`)
  })
  page.on('pageerror', (e) => problems.push(`[pageerror:${t.name}] ${e.message}`))
  page.on('requestfailed', (r) => problems.push(`[reqfail:${t.name}] ${r.url()} — ${r.failure()?.errorText}`))

  const res = await page.goto(`${BASE}${t.path}`, { waitUntil: 'networkidle', timeout: 60000 })
  if (!res || res.status() >= 400) problems.push(`[http:${t.name}] status ${res?.status()}`)

  // Walk the page so lazy images below the fold actually commit. Without this
  // a full-page screenshot captures empty frames and the broken-image check
  // reports a clean run against images that never loaded.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 80))
    }
    // Stay at the bottom — the last lazy images (e.g. a below-the-fold
    // next-project thumbnail at 2× DPR) only load once scrolled to, and
    // returning to the top now would race them.
    window.scrollTo(0, document.body.scrollHeight)
  })
  await page.waitForLoadState('networkidle')

  // Wait until every image has actually decoded, rather than a fixed timeout —
  // a tall page (long galleries) lazy-loads the last images only after the
  // scroll reaches them, and a flat wait races them and false-flags a break.
  await page
    .waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), null, {
      timeout: 10000,
    })
    .catch(() => {})
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(300)

  const pending = await page.evaluate(() =>
    [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
  )
  for (const p of pending) problems.push(`[img:${t.name}] never finished loading ${p}`)

  // Catch any element wider than the viewport — the horizontal-overflow bug
  // that only ever shows up at a real breakpoint.
  const overflow = await page.evaluate(() => {
    const bad = []
    const limit = document.documentElement.clientWidth
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && (r.right > limit + 1 || r.left < -1)) {
        bad.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} right=${Math.round(r.right)} vw=${limit}`)
      }
    }
    return [...new Set(bad)].slice(0, 6)
  })
  for (const o of overflow) problems.push(`[overflow:${t.name}] ${o}`)

  const scrollX = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  if (scrollX) problems.push(`[overflow:${t.name}] page scrolls horizontally`)

  // Broken images ship as empty boxes; naturalWidth catches them.
  const brokenImgs = await page.evaluate(() =>
    [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
  )
  for (const b of brokenImgs) problems.push(`[img:${t.name}] broken ${b}`)

  await page.screenshot({ path: `${OUT}/${t.name}.png`, fullPage: t.full })
  await ctx.close()
}

await browser.close()

if (problems.length) {
  console.log('PROBLEMS FOUND:')
  for (const p of [...new Set(problems)]) console.log('  ' + p)
} else {
  console.log('No console errors, failed requests, broken images or overflow detected.')
}
console.log(`\nShots written to ${OUT}`)
