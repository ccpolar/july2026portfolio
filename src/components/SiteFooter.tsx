import styles from './SiteFooter.module.css'

export const SiteFooter = ({ siteName }: { siteName: string }) => (
  <footer className={styles.footer} style={{ viewTransitionName: 'site-footer' }}>
    <div className={`shell ${styles.inner}`}>
      <span className={styles.name}>{siteName}</span>
      <span>© {new Date().getFullYear()}</span>
    </div>
  </footer>
)
