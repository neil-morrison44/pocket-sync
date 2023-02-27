import { useEffect } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"
import { useRecoilSmoothUpdates } from "../../hooks/recoilSmoothUpdates"
import { newsFeedUpdateAtom } from "../../recoil/newsFeed/atoms"
import { newsFeedSelector } from "../../recoil/newsFeed/selectors"
import { currentViewAtom } from "../../recoil/view/atoms"
import { Link } from "../link"

import "./index.css"

type NewsFeedProps = {
  deepLinks?: boolean
}

const INTERVAL_MINS = 5

export const NewsFeed = ({ deepLinks = false }: NewsFeedProps) => {
  const items = useRecoilSmoothUpdates(newsFeedSelector, [])
  const viewCore = useSetRecoilState(currentViewAtom)
  const setNewsFeedUpdateAtom = useSetRecoilState(newsFeedUpdateAtom)

  useEffect(() => {
    const interval = setInterval(() => {
      setNewsFeedUpdateAtom(Math.random())
    }, INTERVAL_MINS * 60 * 1000)
    return () => clearInterval(interval)
  })

  return (
    <div className="news-feed">
      <div className="news-feed__title">
        {"Updates From the "}
        <Link href="https://openfpga-cores-inventory.github.io/analogue-pocket/">
          OpenFPGA Cores Inventory
        </Link>
      </div>
      <div className="news-feed__list">
        {items.map((i) => {
          return (
            <div
              key={i.title}
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
