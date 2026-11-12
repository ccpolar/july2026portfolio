import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { LiquidLight } from '@/components/toolbox/LiquidLight'
import { MeshGradient } from '@/components/toolbox/MeshGradient'
import { PaletteTool } from '@/components/toolbox/PaletteTool'
import { QuickGrid } from '@/components/toolbox/QuickGrid'
import { TOOLBOX_DEFAULTS } from '@/globals/Toolbox'
import { getChrome } from '@/lib/chrome'
import { getToolbox } from '@/lib/data'

import styles from './page.module.css'

/** The page's words: what's saved in /admin, or the defaults until then. */
const copy = async () => {
  const toolbox = await getToolbox()
  return {
    enabled: toolbox?.enabled !== false,
    heading: toolbox?.heading?.trim() || TOOLBOX_DEFAULTS.heading,
    intro: toolbox?.intro?.trim() || TOOLBOX_DEFAULTS.intro,
    colorifyUrl: toolbox?.colorifyUrl?.trim() || TOOLBOX_DEFAULTS.colorifyUrl,
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const [chrome, toolbox] = await Promise.all([getChrome(), copy()])
  return {
    title: `${toolbox.heading} — ${chrome.siteName}`,
    description: toolbox.intro,
  }
}

/**
 * One tool on the page: its name on a rule, as the portfolio's sections are,
 * a line saying what it's for, then the tool itself.
 */
const Tool = ({
  id,
  label,
  blurb,
  children,
}: {
  id: string
  label: string
  blurb: string
  children: ReactNode
}) => (
  <section className={styles.section} id={id} aria-labelledby={`${id}-heading`}>
    <div className={styles.sectionHead}>
      <h2 className={styles.sectionHeading} id={`${id}-heading`}>
        {label}
      </h2>
      <span className={styles.rule} aria-hidden="true" />
    </div>
    <p className={styles.blurb}>{blurb}</p>
    {children}
  </section>
)

/**
 * The toolbox: small web tools, each complete on the page. Adding one is a
 * new entry in `tools` and its component; the guide at the top and the
 * section under it follow from the list.
 */
export default async function ToolboxPage() {
  const [chrome, toolbox] = await Promise.all([getChrome(), copy()])
  // Switched off in /admin: the page isn't there, as its icon isn't.
  if (!toolbox.enabled) notFound()

  const tools = [
    {
      id: 'mesh-gradient',
      label: 'MeshIt',
      blurb:
        'A handful of points, each its own colour. Drag them until it looks right, then take it with you as a PNG.',
      tool: <MeshGradient />,
    },
    {
      id: 'palette',
      label: 'Colorify Lite',
      blurb:
        'A palette built the way a brand uses one: a primary, a surface, an accent, a support and an ink. Lock what you like and roll the rest.',
      tool: <PaletteTool colorifyUrl={toolbox.colorifyUrl} />,
    },
    {
      id: 'quickgrid',
      label: 'QuickGrid',
      blurb:
        'Bento grids from a number. Say how many tiles, pick a style, shuffle until it clicks, then take it into Figma or Illustrator as plain shapes.',
      tool: <QuickGrid />,
    },
    {
      id: 'liquid-light',
      label: 'GradMap',
      blurb:
        'Generative liquid gradients: pick a palette and a look, swirl the paint, then save a PNG up to 6000px or record a short video.',
      tool: <LiquidLight />,
    },
  ]

  return (
    <>
      <SiteHeader {...chrome} />
      <main id="main">
        <div className={`shell ${styles.head}`}>
          <h1 className={styles.heading}>{toolbox.heading}</h1>
          <p className={styles.intro}>{toolbox.intro}</p>
        </div>

        <nav className={`shell ${styles.guide}`} aria-label="Tools">
          <ul className={styles.guideList}>
            {tools.map((tool) => (
              <li key={tool.id}>
                <a className={styles.guideLink} href={`#${tool.id}`}>
                  {tool.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={`shell ${styles.body}`}>
          {tools.map((tool) => (
            <Tool key={tool.id} id={tool.id} label={tool.label} blurb={tool.blurb}>
              {tool.tool}
            </Tool>
          ))}
        </div>
      </main>
      <SiteFooter siteName={chrome.siteName} />
    </>
  )
}
