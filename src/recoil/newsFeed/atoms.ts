import { atom } from "recoil"
import { FeedItem, RawFeedItem } from "../../types"
import { invokeGetNewsFeed } from "../../utils/invokes"

const INTERVAL_MINS = 5

const convertRaw = (items: RawFeedItem[]) => {
  return items.map(({ title, categories, content, link, published }) => {
    const [_a, _b, coreName] = categories

    return {
      title,
      content,
      published: new Date(published),
      coreName,
      type: "update" as const,
      link,
    }
  })
}

export const newsFeedAtom = atom<{ items: FeedItem[]; lastUpdated: number }>({
  key: "newsFeedAtom",
  default: (async () => {
    return {
      items: convertRaw(await invokeGetNewsFeed()),
      lastUpdated: Date.now(),
    }
  })(),
  effects: [
    ({ setSelf }) => {
      const interval = setInterval(async () => {
        setSelf({
          items: convertRaw(await invokeGetNewsFeed()),
          lastUpdated: Date.now(),
        })
      }, INTERVAL_MINS * 60 * 1000)

      return () => window.clearInterval(interval)
    },
  ],
})
