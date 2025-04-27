import { useInventoryItem } from "../../../../hooks/useInventoryItem"
import { GithubReleasesSelectorFamily } from "../../../../recoil/github/selectors"
import { GithubRelease, InventoryItem } from "../../../../types"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { parseISO, differenceInMilliseconds } from "date-fns"
import { scaleLinear, scalePow } from "d3-scale"
import { useAtomValue } from "jotai"

type DownloadCountProps = {
  coreName: string
}

export const DownloadCount = ({ coreName }: DownloadCountProps) => {
  const inventoryItem = useInventoryItem(coreName)
  if (inventoryItem?.repository.platform !== "github") return null

  return <DownloadCountInner inventoryItem={inventoryItem} />
}

const DownloadCountInner = ({
  inventoryItem,
}: {
  inventoryItem: InventoryItem
}) => {
  const { t } = useTranslation("core_info")

  const { owner, name: repo } = inventoryItem.repository
  const latestTag = inventoryItem.releases[0].core.metadata.version

  const githubReleases = useAtomValue(
    GithubReleasesSelectorFamily({
      owner,
      repo,
    })
  )

  const latestCount = useMemo(() => {
    const latestRelease = githubReleases.find(
      ({ draft, prerelease }) =>
        (!draft && !owner.startsWith("eric")) || prerelease
    )
    if (!latestRelease) return 0
    const latest = findMostDownloadedAsset(latestRelease)
    if (!latest) return 0
    return latest.download_count
  }, [githubReleases, owner])

  const totalCount = useMemo(() => {
    return githubReleases
      .map((release) => {
        const asset = findMostDownloadedAsset(release)
        return asset?.download_count || 0
      })
      .reduce((prev, curr) => prev + curr, 0)
  }, [githubReleases])

  const perVersionCounts = useMemo(() => {
    const currentDate = new Date(Date.now())

    return githubReleases.map((release, index) => {
      const releaseDate = parseISO(release.published_at)
      const asset = findMostDownloadedAsset(release)
      const downloadCount = asset?.download_count || 0

      const replacedOn =
        index === 0
          ? currentDate
          : new Date(githubReleases[index - 1].published_at)

      const daysAsLatest =
        differenceInMilliseconds(replacedOn, releaseDate) / 1000 / 60 / 60 / 24

      const daysAgo =
        differenceInMilliseconds(currentDate, releaseDate) / 1000 / 60 / 60 / 24

      return {
        release: release.tag_name,
        downloadCount,
        downloadsPerDay: downloadCount / daysAsLatest,
        daysAgo,
        daysAsLatest,
      }
    })
  }, [githubReleases])

  if (githubReleases.length === 0) return null

  return (
    <div>
      <div>{t("download_latest", { count: latestCount, tag: latestTag })}</div>
      <div>{t("download_total", { count: totalCount })}</div>

      {githubReleases.length > 1 && (
        <DownloadGraph perVersions={perVersionCounts} />
      )}
    </div>
  )
}

const findMostDownloadedAsset = (release: GithubRelease) =>
  [...release.assets]
    .sort((a, b) => b.download_count - a.download_count)
    .find(({ name }) => name.endsWith(".zip"))

type DownloadGraphProps = {
  perVersions: {
    release: string
    downloadCount: number
    downloadsPerDay: number
    daysAsLatest: number
    daysAgo: number
  }[]
}

const BAR_HEIGHT = 20
const BAR_WIDTH = 150

const DownloadGraph = ({ perVersions }: DownloadGraphProps) => {
  const { t } = useTranslation("core_info")

  const scaleY = scalePow(
    [0, Math.max(...perVersions.map(({ downloadsPerDay }) => downloadsPerDay))],
    [0, BAR_HEIGHT * 0.9]
  ).exponent(0.5)

  const scaleX = scaleLinear(
    [0, Math.max(...perVersions.map(({ daysAgo }) => daysAgo))],
    [BAR_WIDTH, 0]
  )

  return (
    <div
      style={{
        position: "relative",
        width: BAR_WIDTH,
        height: BAR_HEIGHT,
        display: "block",
      }}
    >
      {perVersions.map(
        ({
          downloadsPerDay,
          downloadCount,
          release,
          daysAsLatest,
          daysAgo,
        }) => (
          <div
            key={release}
            className="core-info__download-graph-bar"
            style={{
              left: scaleX(daysAgo),
              width: Math.max(2, BAR_WIDTH - scaleX(daysAsLatest)),
              height: scaleY(downloadsPerDay),
            }}
            title={t("download_bar_title", {
              release,
              count: downloadCount,
              days: Math.round(daysAsLatest),
            })}
          ></div>
        )
      )}
    </div>
  )
}
