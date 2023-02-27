import { selector } from "recoil"
import { FeedItem } from "../../types"
import { invokeGetNewsFeed } from "../../utils/invokes"
import { newsFeedUpdateAtom } from "./atoms"

export const newsFeedSelector = selector<FeedItem[]>({
  key: "newsFeedSelector",
  get: async ({ get }) => {
    get(newsFeedUpdateAtom)
    const rawItems = await invokeGetNewsFeed()
    return rawItems.map(({ title, categories, content, link, published }) => {
      const [_, author, shortname, type] = categories

      return {
        title,
        content,
        published: new Date(published),
        coreName: `${author}.${shortname}`,
        type,
        link,
      }
    })
  },
})
