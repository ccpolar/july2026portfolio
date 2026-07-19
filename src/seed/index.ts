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

  for (const collection of ['projects', 'testimonials', 'media'] as const) {
    await payload.delete({ collection, where: { id: { exists: true } } })
  }
  payload.logger.info('Cleared projects, testimonials and media.')

  const email = process.env.SEED_ADMIN_EMAIL ?? 'cam@polarcreativegroup.com'
  // Local convenience only. Set SEED_ADMIN_PASSWORD before seeding anything
  // that is reachable from the internet, and change it in /admin regardless.
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'changeme-please'
  const existingUsers = await payload.find({ collection: 'users', limit: 1 })
  if (!existingUsers.docs.length) {
    await payload.create({ collection: 'users', data: { email, password, name: 'Cam' } })
    payload.logger.info(`Created admin user ${email} (password: ${password})`)
  }

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

    await payload.create({
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
    payload.logger.info(`Seeded project: ${p.title}${gallery.length ? ` (+${gallery.length} gallery)` : ''}`)
  }

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

  await payload.updateGlobal({
    slug: 'homepage',
    data: {
      heroLine: 'Trust, precision, focus. Made for you.',
      heroIntro:
        'I’m Cam, a freelance designer working with founders and small studios on identity and web. No decks, no drama — careful work, shown early, and built so you can look after it yourself.',
      available: true,
      availabilityLabel: 'Available for new work',
      workHeading: 'Selected work',
      // Left blank on purpose: the work is the argument, so it starts immediately.
      approachHeading: 'How this goes',
      approachBody:
        'Hiring someone is a risk. The point of everything below is to make that risk small and boring, so the only thing left to think about is the work.',
      approachPoints: [
        {
          title: 'You always know where it stands',
          detail:
            'A scope agreed before anything starts, work shown while it is still rough, and a note every week. No silence, no invoice you did not see coming.',
        },
        {
          title: 'One direction, argued for',
          detail:
            'You will not get twelve options to referee. You get the one I think is right and the reasoning behind it — then we pull it apart together.',
        },
        {
          title: 'It ships, and it keeps working',
          detail:
            'I design and build, so nothing is lost in a handover. What you get runs on every screen, and every word and image on it is yours to change.',
        },
      ],
      metaTitle: 'Cam — Freelance designer',
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

  payload.logger.info('Seed complete.')
  process.exit(0)
}

await run()
