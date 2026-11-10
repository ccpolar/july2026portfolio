/** The toolbox's small icons: one weight, one size, drawn to sit beside the
 *  site's sun and moon. */

const PATHS = {
  shuffle: 'M2.5 5h2.2c1.6 0 3 .8 3.8 2.2l1 1.6c.8 1.4 2.200 2.200 3.800 2.200h1.200M2.500 11h2.200c.9 0 1.700-.3 2.400-.8M11.300 5.200c.5-.1 1-.2 1.500-.2h1.700M12.800 3l1.900 2-1.900 2M12.800 9l1.900 2-1.900 2',
  plus: 'M8 3.25v9.5M3.25 8h9.5',
  minus: 'M3.25 8h9.5',
  reset: 'M3 8a5 5 0 1 0 1.6-3.700M3 2.800v2.700h2.700',
  link: 'M6.800 9.200a2.800 2.800 0 0 0 4 0l2-2a2.800 2.800 0 0 0-4-4l-.7.7M9.200 6.800a2.800 2.800 0 0 0-4 0l-2 2a2.800 2.800 0 0 0 4 4l.7-.7',
  download: 'M8 2.500v7.500M4.800 7.200 8 10.300l3.200-3.100M3 13h10',
  copy: 'M5.500 5.500V4A1.500 1.500 0 0 1 7 2.500h5A1.500 1.500 0 0 1 13.500 4v5A1.500 1.500 0 0 1 12 10.500h-1.500M4 5.500h5A1.500 1.500 0 0 1 10.500 7v5A1.500 1.500 0 0 1 9 13.500H4A1.500 1.500 0 0 1 2.500 12V7A1.500 1.500 0 0 1 4 5.500Z',
  lock: 'M4.500 7.250V5.500a3.500 3.500 0 0 1 7 0v1.750M4 7.250h8a1 1 0 0 1 1 1V12.500a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8.250a1 1 0 0 1 1-1Z',
  unlock: 'M4.500 7.250V5.500a3.500 3.500 0 0 1 6.700-1.400M4 7.250h8a1 1 0 0 1 1 1V12.500a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8.250a1 1 0 0 1 1-1Z',
  close: 'm4 4 8 8M12 4l-8 8',
  undo: 'M5.500 3 2.500 6l3 3M2.800 6h6.700a4 4 0 0 1 0 8H7',
  gradient: 'M3.500 2.500h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1ZM2.800 10.500 10.500 2.800M5.500 13.200l7.700-7.700',
} as const

export type IconName = keyof typeof PATHS

export const Icon = ({ name, size = 15 }: { name: IconName; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d={PATHS[name]} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
