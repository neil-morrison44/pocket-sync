import { selector, selectorFamily } from "recoil"
import { Category } from "../../types"
import { allCategoriesSelector } from "../platforms/selectors"
import { coreInventoryAtom } from "./atoms"

export const DownloadURLSelectorFamily = selectorFamily<string | null, string>({
  key: "DownloadURLSelectorFamily",
  get:
    (coreName: string) =>
    async ({ get }) => {
      const inventory = get(coreInventoryAtom)
      const inventoryItem = inventory.data.find(
        ({ identifier }) => coreName === identifier
      )
      if (!inventoryItem || inventoryItem.repository.platform !== "github")
        return null

      return inventoryItem.download_url
    },
})

export const cateogryListselector = selector<Category[]>({
  key: "CateogryListselector",
  get: ({ get }) => {
    const inventory = get(coreInventoryAtom)
    const deviceCategories = get(allCategoriesSelector)

    const cateogrySet = new Set([
      ...inventory.data.map(({ platform }) => platform.category),
      ...deviceCategories,
    ])

    return ["All", ...Array.from(cateogrySet)]
  },
})
