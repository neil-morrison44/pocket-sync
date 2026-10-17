import { Suspense, useRef } from "react"
import { useYScrollAsXScroll } from "../../hooks/useYScrollAsXScroll"
import { newsFeedAtom } from "../../jotai/newsFeed/atoms"
import { currentViewAtom } from "../../jotai/view/atoms"
import { Link } from "../link"
import { useTranslation, Trans } from "react-i18next"

import "./index.css"
import { TimeAgo } from "./timeAgo"
import { useAtomValue, useSetAtom } from "jotai"
import { useInventoryItem } from "../../hooks/useInventoryItem"
import { coresListSelector } from "../../jotai/selectors"
import { InventoryPlatformImage } from "../cores/platformImage"
import Tag, { TagList } from "../ui/Tag"
import { useSmoothedAtomValue } from "../../utils/jotai"
import { useRovingFocus } from "../../hooks/useRovingFocus"

type NewsFeedProps = {
  deepLinks?: boolean
  orientation?: "horizontal" | "vertical"
}

export const NewsFeed = ({
  deepLinks = false,
  orientation = "horizontal",
}: NewsFeedProps) => {
  const { items, lastUpdated } = useSmoothedAtomValue(newsFeedAtom)
  const viewCore = useSetAtom(currentViewAtom)
  const horizontalScrollRef = useYScrollAsXScroll()
  const verticalListRef = useRef<HTMLDivElement>(null)
  const rovingFocus = useRovingFocus(
    verticalListRef,
    ':scope > [role="button"]'
  )
  const isVertical = orientation === "vertical"
  const { t } = useTranslation("news_feed")

  return (
    <div className={`news-feed news-feed--${orientation}`}>
      <div className="news-feed__title">
        <Trans t={t} i18nKey={"updates_from"}>
          {"_"}
          <Link href="https://openfpga-library.github.io/analogue-pocket/">
            {"_"}
          </Link>
        </Trans>
        <span className="news-feed__title-last-updated">
          <Trans t={t} i18nKey={"last_updated"}>
            {"_"}
            <TimeAgo since={lastUpdated} />
          </Trans>
        </span>
      </div>
      <div
        className="news-feed__list"
        ref={isVertical ? verticalListRef : horizontalScrollRef}
        {...(isVertical ? rovingFocus : {})}
      >
        {items.map((i) => {
          return (
            <div
              key={`${i.title}-${i.published.toTimeString()}`}
              className={`news-feed__item news-feed__item--${
                i.type
              } news-feed__item--${deepLinks ? "link" : "not-link"}`}
              role={deepLinks ? "button" : undefined}
              onClick={() => {
                if (!deepLinks) return
                viewCore({ view: "Cores", selected: i.coreName })
              }}
            >
              {isVertical && i.coreName && (
                <Suspense fallback={<span className="news-feed__item-image" />}>
                  <NewsCoreImage coreName={i.coreName} />
                </Suspense>
              )}
              <div className="news-feed__item-text">
                <div className="news-feed__item-title">{i.title}</div>
                <div className="news-feed__item-published">
                  <div>{i.published.toLocaleDateString()}</div>
                  <div>{i.published.toLocaleTimeString()}</div>
                </div>
                {isVertical && deepLinks && i.coreName && (
                  <Suspense>
                    <InstalledTag coreName={i.coreName} />
                  </Suspense>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** The updated core's platform image, so the row is easy to place. */
const NewsCoreImage = ({ coreName }: { coreName: string }) => {
  const inventoryItem = useInventoryItem(coreName)
  const platformId = inventoryItem?.releases[0]?.core.metadata.platform_ids[0]
  if (!platformId) return <span className="news-feed__item-image" />
  return (
    <InventoryPlatformImage
      className="news-feed__item-image"
      platformId={platformId}
      label={platformId}
    />
  )
}

/** "Installed" when the updated core is on the SD card. */
const InstalledTag = ({ coreName }: { coreName: string }) => {
  const installedCores = useAtomValue(coresListSelector)
  const { t } = useTranslation("core_info")
  if (!installedCores.includes(coreName)) return null
  return (
    <TagList className="news-feed__item-tags">
      <Tag icon="check">{t("tags.installed")}</Tag>
    </TagList>
  )
}
