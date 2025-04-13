import { Suspense, useMemo } from "react"
import { Modal } from "../../modal"
import { pocketSyncChangelogSelector } from "../../../recoil/github/selectors"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Link } from "../../link"
import { Loader } from "../../loader"
import { useTranslation } from "react-i18next"
import { useAtomValue } from "jotai"

export const Changelog = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation("about")
  return (
    <Modal>
      <Suspense fallback={<Loader grow />}>
        <div className="about__changelog-text">
          <ChangelogInner />
        </div>
      </Suspense>
      <button onClick={onClose}>{t("close_changelog")}</button>
    </Modal>
  )
}

const ChangelogInner = () => {
  const changelogMarkdown = useAtomValue(pocketSyncChangelogSelector)

  // console.log({ changelogMarkdown })

  const tidiedChangelog = useMemo(() => {
    return changelogMarkdown
      .replace(/\*\*Full Changelog\*\*: ([^\n]+)/gi, "")
      .replace(/<img .+src="(.+)".?>/gi, (_full, src) => `![](${src})`)
      .replace(/- (\d{4}-\d{2}-\d{2})/gi, (_full, date) => date)
      .replace("# Changelog", "")
  }, [changelogMarkdown])

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      skipHtml
      components={{
        h1: ({ children }) => (
          <>
            <div className="about__changelog-break" />
            <h3 className="about__changelog-title">{children}</h3>
          </>
        ),
        h2: "h3",
        h3: "h4",
        h4: "h5",
        h5: "strong",
        a: ({ href, children }) => <Link href={href}>{children}</Link>,
        img: ({ src }) => <img className="about__changelog-image" src={src} />,
      }}
    >
      {tidiedChangelog}
    </ReactMarkdown>
  )
}
