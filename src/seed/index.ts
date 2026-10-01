import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Seeds the local database with demo content so the design can be judged
 * against something real. Everything here is meant to be replaced through
 * /admin — see the notes in each block.
 *
 * Safe to re-run: it clears the collections it owns first.
 */

type Seed = {
  slug: string
  title: string
  client: string
  year: number
  disciplines: string[]
  summary: string
  photo: string
  alt: string
  gallery?: { photo: string; alt: string; caption?: string; size?: 'full' | 'half' }[]
}

// Every photo id below was verified against the Unsplash CDN before being
// committed here — no guessed ids.
const PROJECTS: Seed[] = [
  {
    slug: 'fold-coffee',
    title: 'Fold Coffee',
    client: 'Fold Coffee',
    year: 2026,
    disciplines: ['Identity', 'Signage', 'Web'],
    summary:
      'A roastery in a former joinery workshop. The identity had to hold up on a paper bag, a chalkboard, and a shopfront — so we drew it for the worst case first.',
    photo: 'photo-1493857671505-72967e2e2760',
    alt: 'The Fold Coffee counter, with the day’s list hand-set on a black board above stacked bags of beans.',
    gallery: [
      {
        photo: 'photo-1442512595331-e89e73853f31',
        alt: 'A single pour-over brewing at the Fold bar, kettle mid-pour over a paper filter.',
        caption: 'The pour-over bar, built into the old workbench.',
        size: 'full',
      },
      {
        photo: 'photo-1559496417-e7f25cb247f3',
        alt: 'A glass of layered latte on a pale counter, raking morning light casting long leaf shadows.',
        caption: 'Morning light through the front window.',
        size: 'half',
      },
      {
        photo: 'photo-1521302080334-4bebac2763a6',
        alt: 'A clear glass of black filter coffee on a wooden coaster, hard shadow beneath.',
        caption: 'House filter, served black.',
        size: 'half',
      },
      {
        photo: 'photo-1498804103079-a6351b050096',
        alt: 'Nine cups of coffee arranged in a ring on a dark round table, each a different drink.',
        caption: 'Every drink on the menu, shot in one sitting for the launch.',
        size: 'full',
      },
    ],
  },
  {
    slug: 'ossa',
    title: 'Ossa',
    client: 'Ossa',
    year: 2025,
    disciplines: ['Art Direction', 'Campaign'],
    summary:
      'A shoemaker’s first campaign. Every set was built by hand, so the photographs would look the way the product does: made, not manufactured.',
    photo: 'photo-1560343090-f0409e92791a',
    alt: 'A teal leather brogue standing on a pale geometric set, lit hard from the left.',
  },
  {
    slug: 'meridian',
    title: 'Meridian',
    client: 'Meridian',
    year: 2025,
    disciplines: ['Identity', 'Menus', 'Web'],
    summary:
      'A restaurant that opens at dusk and closes late. The whole identity is built to be read in low light, which ruled out most of the obvious answers.',
    photo: 'photo-1517248135467-4c7edcad34c4',
    alt: 'Meridian’s dining room after dark, brass fittings and low pendant lights over set tables.',
    gallery: [
      {
        photo: 'photo-1559925393-8be0ec4767c8',
        alt: 'The Meridian frontage at dusk, warm light spilling onto a cobbled side street.',
        caption: 'The frontage, lit for the hour it opens.',
        size: 'full',
      },
      {
        photo: 'photo-1414235077428-338989a2e8c0',
        alt: 'A close table at Meridian mid-service, wine poured, plates being set down.',
        caption: 'Mid-service, on a full night.',
        size: 'half',
      },
      {
        photo: 'photo-1600891964092-4316c288032e',
        alt: 'A plate of steak and hand-cut fries under warm restaurant light.',
        caption: 'From the opening menu.',
        size: 'half',
      },
    ],
  },
  {
    slug: 'ilex',
    title: 'Ilex',
    client: 'Ilex',
    year: 2024,
    disciplines: ['Product', 'Packaging'],
    summary:
      'A wearable that didn’t want to look like a gadget. The packaging had to feel closer to a watch box than a phone box, at a fraction of the cost.',
    photo: 'photo-1523275335684-37898b6baf30',
    alt: 'The Ilex band and housing laid flat on a pale grey surface.',
  },
]

const fetchPhoto = async (id: string) => {
  const res = await fetch(`https://images.unsplash.com/${id}?auto=format&fit=crop&w=2000&q=80`)
  if (!res.ok) throw new Error(`Image ${id} failed: HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.byteLength < 10_000) throw new Error(`Image ${id} suspiciously small (${buf.byteLength}b)`)
  return buf
}

const run = async () => {
  const payload = await getPayload({ config })

  for (const collection of ['projects', 'moodboard', 'testimonials', 'media'] as const) {
    await payload.delete({ collection, where: { id: { exists: true } } })
  }
  payload.logger.info('Cleared work, moodboard, testimonials and media.')

  const email = process.env.SEED_ADMIN_EMAIL ?? 'cam@polarcreativegroup.com'
  // Local convenience only. Set SEED_ADMIN_PASSWORD before seeding anything
  // that is reachable from the internet, and change it in /admin regardless.
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'changeme-please'
  const existingUsers = await payload.find({ collection: 'users', limit: 1 })
  if (!existingUsers.docs.length) {
    await payload.create({ collection: 'users', data: { email, password, name: 'Cam' } })
    payload.logger.info(`Created admin user ${email} (password: ${password})`)
  }

  const projectIdBySlug: Record<string, number> = {}
  let order = 0
  for (const p of PROJECTS) {
    const media = await payload.create({
      collection: 'media',
      data: { alt: p.alt },
      file: {
        data: await fetchPhoto(p.photo),
        mimetype: 'image/jpeg',
        name: `${p.slug}.jpg`,
        size: 0,
      },
    })

    const gallery = []
    for (const [i, g] of (p.gallery ?? []).entries()) {
      const galleryMedia = await payload.create({
        collection: 'media',
        data: { alt: g.alt },
        file: {
          data: await fetchPhoto(g.photo),
          mimetype: 'image/jpeg',
          name: `${p.slug}-gallery-${i + 1}.jpg`,
          size: 0,
        },
      })
      gallery.push({ image: galleryMedia.id, caption: g.caption, size: g.size ?? 'full' })
    }

    const created = await payload.create({
      collection: 'projects',
      data: {
        title: p.title,
        slug: p.slug,
        client: p.client,
        year: p.year,
        disciplines: p.disciplines.map((label) => ({ label })),
        summary: p.summary,
        cover: media.id,
        gallery,
        featured: true,
        order: order++,
      },
    })
    projectIdBySlug[p.slug] = created.id
    payload.logger.info(`Seeded project: ${p.title}${gallery.length ? ` (+${gallery.length} gallery)` : ''}`)
  }

  // — Portfolio categories —
  // Placeholder demo content so the /portfolio page renders during design.
  // Photo ids are reused from the verified pool above. Replace via /admin.
  const makeMedia = async (photo: string, alt: string, name: string) => {
    const doc = await payload.create({
      collection: 'media',
      data: { alt },
      file: { data: await fetchPhoto(photo), mimetype: 'image/jpeg', name, size: 0 },
    })
    return doc.id
  }

  // The portfolio page is the same Work collection, sliced by section. A piece
  // that's already a project gains a section; one that only ever lived on the
  // portfolio page becomes a project of its own, off Recent Work.
  type Section = 'branding' | 'merchandise' | 'advertising' | 'website'

  const addSections = async (slug: string, sections: Section[], liveUrl?: string) => {
    const id = projectIdBySlug[slug]
    if (!id) return
    const existing = await payload.findByID({ collection: 'projects', id, depth: 0 })
    await payload.update({
      collection: 'projects',
      id,
      data: {
        category: [...new Set([...(existing.category ?? []), ...sections])],
        ...(liveUrl ? { liveUrl } : {}),
      },
    })
  }

  const addPiece = async (
    piece: {
      title: string
      photo: string
      sections: Section[]
      summary?: string
      liveUrl?: string
    },
    order: number,
  ) => {
    const cover = await makeMedia(piece.photo, piece.title, `portfolio-${order}.jpg`)
    await payload.create({
      collection: 'projects',
      data: {
        title: piece.title,
        cover,
        category: piece.sections,
        summary: piece.summary,
        liveUrl: piece.liveUrl,
        // On the portfolio page, not on Recent Work.
        featured: false,
        order,
      },
    })
  }

  // Four of the Recent Work projects also belong in portfolio sections.
  await addSections('fold-coffee', ['branding', 'merchandise', 'website'], 'https://example.com')
  await addSections('ossa', ['branding', 'advertising'])
  await addSections('meridian', ['branding', 'website'])
  await addSections('ilex', ['branding', 'advertising', 'website'], 'https://example.com')

  const pieces: Parameters<typeof addPiece>[0][] = [
    { title: 'Harbour Supply', photo: 'photo-1442512595331-e89e73853f31', sections: ['branding'] },
    { title: 'Tidewater', photo: 'photo-1521302080334-4bebac2763a6', sections: ['branding', 'merchandise'] },
    { title: 'Caldera tote', photo: 'photo-1560343090-f0409e92791a', sections: ['merchandise'] },
    { title: 'Caldera cap', photo: 'photo-1523275335684-37898b6baf30', sections: ['merchandise'] },
    { title: 'Field mug', photo: 'photo-1600891964092-4316c288032e', sections: ['merchandise'] },
    { title: 'Ossa tee', photo: 'photo-1517248135467-4c7edcad34c4', sections: ['merchandise'] },
    { title: 'Longshore crate', photo: 'photo-1414235077428-338989a2e8c0', sections: ['merchandise'] },
    {
      title: 'Outdoor run',
      photo: 'photo-1498804103079-a6351b050096',
      sections: ['advertising'],
      summary: 'Out-of-home, city centre run.',
    },
    {
      title: 'Launch week social',
      photo: 'photo-1559496417-e7f25cb247f3',
      sections: ['advertising'],
      summary: 'A fortnight of paid and organic.',
    },
    { title: 'Transit campaign', photo: 'photo-1559925393-8be0ec4767c8', sections: ['advertising'] },
    {
      title: 'Ossa Studio',
      photo: 'photo-1493857671505-72967e2e2760',
      sections: ['website'],
      liveUrl: 'https://example.com',
    },
  ]

  let pOrder = 0
  for (const piece of pieces) await addPiece(piece, pOrder++)

  payload.logger.info(
    `Seeded the portfolio: 4 projects given sections, ${pieces.length} pieces added.`,
  )

  // — Moodboard —
  const moodSeed: { title: string; photo: string; blockSize: 'small' | 'medium' | 'large' }[] = [
    { title: 'Raked light', photo: 'photo-1559496417-e7f25cb247f3', blockSize: 'large' },
    { title: 'Worn concrete', photo: 'photo-1521302080334-4bebac2763a6', blockSize: 'small' },
    { title: 'Brass + oak', photo: 'photo-1517248135467-4c7edcad34c4', blockSize: 'medium' },
    { title: 'Paper stock', photo: 'photo-1498804103079-a6351b050096', blockSize: 'medium' },
    { title: 'Low-light interior', photo: 'photo-1559925393-8be0ec4767c8', blockSize: 'small' },
    { title: 'Table setting', photo: 'photo-1414235077428-338989a2e8c0', blockSize: 'large' },
    { title: 'Cool ceramic', photo: 'photo-1600891964092-4316c288032e', blockSize: 'medium' },
    { title: 'Morning counter', photo: 'photo-1442512595331-e89e73853f31', blockSize: 'small' },
  ]
  let moodOrder = 0
  for (const m of moodSeed) {
    const image = await makeMedia(m.photo, `${m.title} — moodboard reference`, `mood-${moodOrder}.jpg`)
    await payload.create({
      collection: 'moodboard',
      data: { title: m.title, image, blockSize: m.blockSize, order: moodOrder++ },
    })
  }
  payload.logger.info(`Seeded moodboard: ${moodSeed.length} images.`)

  // PLACEHOLDER — these two are invented. Replace them with the real quotes
  // you have, or untick "published" and the homepage drops the section.
  const testimonials = [
    {
      quote:
        'Cam sent one direction instead of six, and explained exactly why. It was the first time in a rebrand I felt like someone else was holding the thing.',
      name: 'Ines Varga',
      role: 'Founder',
      company: 'Fold Coffee',
      order: 0,
      published: true,
    },
    {
      quote:
        'We opened three weeks after the handover and I have not had to email him once about a broken page. It just works, and I can change the copy myself.',
      name: 'Tom Régnier',
      role: 'Owner',
      company: 'Meridian',
      order: 1,
      published: true,
    },
  ]

  for (const t of testimonials) {
    await payload.create({ collection: 'testimonials', data: t })
  }
  payload.logger.info('Seeded 2 placeholder testimonials — replace before launch.')

  // The hero's fan of photographs. Portrait crops, since the cards are tall.
  const heroCardPhotos = [
    'photo-1493857671505-72967e2e2760',
    'photo-1517248135467-4c7edcad34c4',
    'photo-1523275335684-37898b6baf30',
    'photo-1498804103079-a6351b050096',
    'photo-1442512595331-e89e73853f31',
    'photo-1521302080334-4bebac2763a6',
    'photo-1559925393-8be0ec4767c8',
  ]
  const heroCards = []
  let cOrder = 0
  for (const photo of heroCardPhotos) {
    const image = await makeMedia(photo, `Hero card ${cOrder + 1}`, `hero-card-${cOrder}.jpg`)
    heroCards.push({ image })
    cOrder += 1
  }
  payload.logger.info(`Seeded ${heroCards.length} hero carousel cards.`)

  await payload.updateGlobal({
    slug: 'homepage',
    data: {
      heroLine: 'Trust, precision, focus. Made for you.',
      heroIntro:
        'I’m Cam, a freelance designer working with founders and small studios on identity and web. No decks, no drama — careful work, shown early, and built so you can look after it yourself.',
      heroCards,
      available: true,
      availabilityLabel: 'Available for new work',
      workHeading: 'Selected work',
      // Left blank on purpose: the work is the argument, so it starts immediately.
      servicesHeading: 'Services',
      blogHeading: 'Blog',
      metaDescription:
        'Freelance designer working with founders and small studios on brand identity and web. Considered work, shown early, built to last.',
    },
  })

  await payload.updateGlobal({
    slug: 'contact',
    data: {
      heading: 'Let’s talk about what you’re making.',
      blurb:
        'Tell me roughly what it is, when you need it, and what your budget looks like. I read everything and reply within a day or two, even if it is not a fit.',
      email,
      // Left empty deliberately: an invented scheduling link would be a dead
      // link. Add a real Cal.com/Calendly URL in /admin and the button appears.
      newsletter: {
        enabled: true,
        blurb: 'Occasional notes on new work. A few times a year, never more.',
      },
    },
  })

  await payload.updateGlobal({
    slug: 'theme',
    data: {
      background: '#ffffff',
      text: '#12120c',
      mutedText: '#5e5e55',
      surface: '#f6f6f2',
      border: '#deded9',
      brandColor: '#343519', // deep olive
      signalColor: '#bfc824', // availability-dot green
      radius: 'sharp',
    },
  })

  await payload.updateGlobal({
    slug: 'identity',
    data: { siteName: 'Cam', browserTitle: 'Cam — Freelance designer' },
  })

  payload.logger.info('Seed complete.')
  process.exit(0)
}

await run()
