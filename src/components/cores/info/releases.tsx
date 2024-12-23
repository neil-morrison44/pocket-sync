import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { InventoryItem } from "../../../types"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useState } from "react"
import { Link } from "../../link"
import { GithubReleasesSelectorFamily } from "../../../recoil/github/selectors"
import { useTranslation } from "react-i18next"

import "./releases.css"

type ReleasesProps = {
  inventoryItem: InventoryItem
}

const INITAL_COUNT = 1

export const Releases = ({ inventoryItem }: ReleasesProps) => {
  if (inventoryItem.repository.platform !== "github") {
    throw new Error("Can't show non-github releases")
  }
  const { t } = useTranslation("core_info")
  const [showAll, setShowAll] = useState(false)

  const githubReleases = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    GithubReleasesSelectorFamily({
      owner: inventoryItem.repository.owner,
      repo: inventoryItem.repository.name,
      latest: inventoryItem.version,
    })
  )

  return (
    <div>
      <strong>{t("releases.release_history")}:</strong>
      {githubReleases
        .slice(0, showAll ? Infinity : INITAL_COUNT)
        .map(({ id, name, body, tag_name, created_at }) => (
          <div key={id}>
            <div className="releases__title">
              {tag_name} - {name}
              <div>{new Date(created_at).toLocaleString()}</div>
            </div>

            <ReleaseBody body={body} />
          </div>
        ))}

      {!showAll && githubReleases.length > INITAL_COUNT && (
        <div
          className="releases__more-button"
          role="button"
          onClick={() => setShowAll(true)}
        >
          {t("releases.show_previous")}
        </div>
      )}
    </div>
  )
}

type ReleaseBodyProps = {
  body: string
}

const ReleaseBody = ({ body }: ReleaseBodyProps) => {
  const [collapsed, setCollapsed] = useState(true)

  return (
    <div
      className={`releases__body ${
        collapsed ? "releases__body--collapsed" : ""
      }`}
      onClick={() => setCollapsed(false)}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: "h3",
          h2: "h3",
          h3: "h4",
          h4: "h5",
          h5: "strong",
          a: ({ href, children }) => <Link href={href}>{children}</Link>,
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  )
}
