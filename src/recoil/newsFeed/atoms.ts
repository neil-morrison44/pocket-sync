import { atomWithRefresh } from "jotai/utils"
import { FeedItem, RawFeedItem } from "../../types"
import { invokeGetNewsFeed } from "../../utils/invokes"
import { withAtomEffect } from "jotai-effect"

const INTERVAL_MINS = 5

const convertRaw = (items: RawFeedItem[]): FeedItem[] => {
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

const baseNewsFeedAtom = atomWithRefresh(async (_get) => ({
  items: convertRaw(await invokeGetNewsFeed()),
  lastUpdated: Date.now(),
}))

export const newsFeedAtom = withAtomEffect(baseNewsFeedAtom, (_get, set) => {
  const interval = setInterval(
    () => set(baseNewsFeedAtom),
    INTERVAL_MINS * 60 * 1000
  )
  return () => clearInterval(interval)
})
