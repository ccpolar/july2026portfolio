import styles from './SiteFooter.module.css'

export const SiteFooter = () => (
  <footer className={styles.footer} style={{ viewTransitionName: 'site-footer' }}>
    <div className={`shell ${styles.inner}`}>
      <span className={styles.name}>Cam</span>
      <span>© {new Date().getFullYear()}</span>
    </div>
  </footer>
)
