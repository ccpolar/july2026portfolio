import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import styles from './LegalDocument.module.css'

type Props = {
  title: string
  content: SerializedEditorState
}

/** The body of /terms and /privacy: a plain, readable document page. */
export const LegalDocument = ({ title, content }: Props) => (
  <>
    <div className={`shell ${styles.header}`}>
      <h1 className={styles.title}>{title}</h1>
    </div>
    <div className={`shell ${styles.body}`}>
      <div className={styles.prose}>
        <RichText data={content} />
      </div>
    </div>
  </>
)
