import { useRecoilValue, useSetRecoilState } from "recoil"
import { useRecoilSmoothUpdates } from "../../hooks/recoilSmoothUpdates"
import { useYScrollAsXScroll } from "../../hooks/useYScrollAsXScroll"
import { newsFeedUpdateAtom } from "../../recoil/newsFeed/atoms"
import { newsFeedSelector } from "../../recoil/newsFeed/selectors"
import { currentViewAtom } from "../../recoil/view/atoms"
import { Link } from "../link"

import "./index.css"
import { TimeAgo } from "./timeAgo"

type NewsFeedProps = {
  deepLinks?: boolean
}

export const NewsFeed = ({ deepLinks = false }: NewsFeedProps) => {
  const items = useRecoilSmoothUpdates(newsFeedSelector, [])
  const viewCore = useSetRecoilState(currentViewAtom)
  const newsfeedLastUpdate = useRecoilValue(newsFeedUpdateAtom)
  const listRef = useYScrollAsXScroll()

  return (
    <div className="news-feed">
      <div className="news-feed__title">
        {"Updates From the "}
        <Link href="https://openfpga-cores-inventory.github.io/analogue-pocket/">
          OpenFPGA Cores Inventory
        </Link>
        <span className="news-feed__title-last-updated">
          {` last updated `}
          <TimeAgo since={newsfeedLastUpdate} />
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
