import { useSetRecoilState } from "recoil"
import { useRecoilSmoothUpdates } from "../../hooks/recoilSmoothUpdates"
import { useYScrollAsXScroll } from "../../hooks/useYScrollAsXScroll"
import { newsFeedAtom } from "../../recoil/newsFeed/atoms"
import { currentViewAtom } from "../../recoil/view/atoms"
import { Link } from "../link"
import { useTranslation, Trans } from "react-i18next"

import "./index.css"
import { TimeAgo } from "./timeAgo"

type NewsFeedProps = {
  deepLinks?: boolean
}

export const NewsFeed = ({ deepLinks = false }: NewsFeedProps) => {
  const { items, lastUpdated } = useRecoilSmoothUpdates(newsFeedAtom, {
    items: [],
    lastUpdated: 0,
  })
  const viewCore = useSetRecoilState(currentViewAtom)
  const listRef = useYScrollAsXScroll()
  const { t } = useTranslation("news_feed")

  return (
    <div className="news-feed">
      <div className="news-feed__title">
        <Trans t={t} i18nKey={"updates_from"}>
          {"_"}
          <Link href="https://openfpga-cores-inventory.github.io/analogue-pocket/">
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
      <div className="news-feed__list" ref={listRef}>
        {items.map((i) => {
          return (
            <div
              key={`${i.title}-${i.published.toTimeString()}`}
              className={`news-feed__item news-feed__item--${
                i.type
              } news-feed__item--${deepLinks ? "link" : "not-link"}`}
              onClick={() => {
                if (!deepLinks) return
                viewCore({ view: "Cores", selected: i.coreName })
              }}
            >
              <div className="news-feed__item-title">{i.title}</div>
              <div className="news-feed__item-published">
                <div>{i.published.toLocaleDateString()}</div>
                <div>{i.published.toLocaleTimeString()}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
