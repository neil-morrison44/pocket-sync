import { GithubRelease, InventoryItem } from "../../../types"
import { useInstallCore } from "../../../hooks/useInstallCore"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ReactNode, Suspense, useMemo, useState } from "react"
import { Link } from "../../link"
import { GithubReleasesSelectorFamily } from "../../../jotai/github/selectors"
import { useTranslation } from "react-i18next"
import { useAtomValue } from "jotai"
import Accordion, { AccordionItem } from "../../ui/Accordion"
import Button from "../../ui/Button"
import Skeleton from "../../ui/Skeleton"
import Tag from "../../ui/Tag"
import { InstallOlderVersion } from "./installOlderVersion"

import "./releases.css"

const PAGE_SIZE = 10

type ReleasesProps = {
  coreName: string
  inventoryItem: InventoryItem
  /** The version on the SD card, to mark its release. */
  installedVersion?: string
}

/**
 * The GitHub release notes as a list like the firmware versions, each with
 * its own install button. Only the latest starts unfolded. Cores without
 * GitHub releases get a version picker instead.
 */
export const Releases = (props: ReleasesProps) => (
  <div className="releases">
    {props.inventoryItem.repository.platform === "github" ? (
      <Suspense fallback={<ReleasesSkeleton />}>
        <GithubReleases {...props} />
      </Suspense>
    ) : (
      <InstallOlderVersion
        coreName={props.coreName}
        inventoryItem={props.inventoryItem}
      />
    )}
  </div>
)

const GithubReleases = ({
  coreName,
  inventoryItem,
  installedVersion,
}: ReleasesProps) => {
  const { owner, name: repo } = inventoryItem.repository
  const githubReleases = useAtomValue(
    GithubReleasesSelectorFamily({ owner, repo })
  )
  const { t } = useTranslation("core_info")
  const { installCore } = useInstallCore()
  const [count, setCount] = useState(PAGE_SIZE)

  // The inventory has the download for each version; GitHub has the notes
  const downloadUrls = useMemo(() => {
    const urls = new Map<number, string>()
    for (const release of githubReleases) {
      const match = inventoryItem.releases.find(({ core }) =>
        isSameVersion(release.tag_name, core.metadata.version)
      )
      if (match) urls.set(release.id, match.download_url)
    }
    return urls
  }, [githubReleases, inventoryItem])

  // Without notes, or if no version matches, keep the plain picker
  if (githubReleases.length === 0 || downloadUrls.size === 0) {
    return (
      <>
        <InstallOlderVersion
          coreName={coreName}
          inventoryItem={inventoryItem}
        />
        {githubReleases.length > 0 && (
          <ReleaseList
            releases={githubReleases.slice(0, count)}
            installedVersion={installedVersion}
          />
        )}
        {count < githubReleases.length && (
          <ShowMoreButton onClick={() => setCount((c) => c + PAGE_SIZE)} />
        )}
      </>
    )
  }

  return (
    <section className="releases__history">
      <h3 className="detail-page__section-title">
        {t("releases.release_history")}
      </h3>
      <ReleaseList
        releases={githubReleases.slice(0, count)}
        installedVersion={installedVersion}
        renderInstall={(release) => {
          const url = downloadUrls.get(release.id)
          if (!url || isSameVersion(release.tag_name, installedVersion))
            return null
          return (
            <Button
              theme="tertiary"
              icon="download"
              onClick={() => installCore(coreName, url)}
            >
              {t("controls.install_release")}
            </Button>
          )
        }}
      />
      {count < githubReleases.length && (
        <ShowMoreButton onClick={() => setCount((c) => c + PAGE_SIZE)} />
      )}
    </section>
  )
}

const ShowMoreButton = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation("core_info")
  return (
    <div>
      <Button theme="tertiary" onClick={onClick}>
        {t("releases.show_previous")}
      </Button>
    </div>
  )
}

type ReleaseListProps = {
  releases: GithubRelease[]
  installedVersion?: string
  /** An install button for the release, if it can be installed. */
  renderInstall?: (release: GithubRelease) => ReactNode
}

const ReleaseList = ({
  releases,
  installedVersion,
  renderInstall,
}: ReleaseListProps) => {
  const { t } = useTranslation("core_info")
  if (releases.length === 0) return null

  return (
    <Accordion type="multiple" defaultValue={[`${releases[0].id}`]}>
      {releases.map((release, index) => {
        const { id, name, body, tag_name, published_at, prerelease, html_url } =
          release
        return (
          <AccordionItem
            key={id}
            value={`${id}`}
            title={tag_name}
            meta={new Date(published_at).toLocaleDateString()}
            aside={
              <>
                {index === 0 && (
                  <Tag theme="accent">{t("releases.latest")}</Tag>
                )}
                {isSameVersion(tag_name, installedVersion) && (
                  <Tag icon="check">{t("tags.installed")}</Tag>
                )}
                {prerelease && (
                  <Tag theme="warning">{t("releases.prerelease")}</Tag>
                )}
              </>
            }
            action={renderInstall?.(release)}
          >
            <div className="releases__body">
              {name && name !== tag_name && (
                <strong className="releases__name">{name}</strong>
              )}
              <ReleaseBody body={body} />
              <Link className="releases__link" href={html_url}>
                {t("releases.on_github")}
              </Link>
            </div>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}

/** Tags often carry a "v" the core.json version doesn't, or the other way. */
const isSameVersion = (tag: string, version: string | undefined) => {
  if (!version) return false
  const normalise = (v: string) => v.trim().toLowerCase().replace(/^v/, "")
  return normalise(tag) === normalise(version)
}

const ReleaseBody = ({ body }: { body: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      h1: "h4",
      h2: "h4",
      h3: "h4",
      h4: "h5",
      h5: "strong",
      a: ({ href, children }) => <Link href={href}>{children}</Link>,
    }}
  >
    {body}
  </ReactMarkdown>
)

const ReleasesSkeleton = () => (
  <div className="releases__skeleton">
    <Skeleton height={44} />
    <Skeleton height={44} />
    <Skeleton height={44} />
  </div>
)
