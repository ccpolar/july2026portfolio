/**
 * The sections of the Portfolio page, in the order they appear on it.
 *
 * The one list everything else reads from: the Portfolio sections field in
 * the admin, the Work list's section row, the portfolio query, the
 * dashboard's count. Adding a section here is what makes it exist everywhere
 * at once — Email Design was added to the site first and for a while had no
 * way in from the admin, which is the gap this closes.
 *
 * A new value also needs adding to the database's list of allowed values
 * (enum_projects_category in scripts/ensure-schema.cjs), and a place on the
 * portfolio page to be shown.
 */
export const PORTFOLIO_SECTIONS = [
  { label: 'Branding', value: 'branding' },
  { label: 'Merchandise', value: 'merchandise' },
  { label: 'Advertising', value: 'advertising' },
  { label: 'Email Design', value: 'email' },
  { label: 'Website', value: 'website' },
] as const

export type PortfolioSectionValue = (typeof PORTFOLIO_SECTIONS)[number]['value']

export const PORTFOLIO_SECTION_VALUES: PortfolioSectionValue[] = PORTFOLIO_SECTIONS.map(
  (section) => section.value,
)

export const isPortfolioSection = (value: unknown): value is PortfolioSectionValue =>
  typeof value === 'string' && (PORTFOLIO_SECTION_VALUES as string[]).includes(value)
