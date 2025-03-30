import { selector, selectorFamily } from "recoil"
import { Category, PlatformId, PlatformInfoJSON } from "../../types"
import { allCategoriesSelector } from "../platforms/selectors"
import { coreInventoryAtom } from "./atoms"

export const CorePlatformSelectorFamily = selectorFamily<
  PlatformInfoJSON["platform"] | null,
  PlatformId
>({
  key: "CorePlatformSelectorFamily",
  get:
    (platformId: PlatformId) =>
    ({ get }) => {
      const inventory = get(coreInventoryAtom)
      const platform = inventory.platforms.data.find(
        ({ id }) => id === platformId
      )
      return platform ?? null
    },
})

export const DownloadURLSelectorFamily = selectorFamily<string | null, string>({
  key: "DownloadURLSelectorFamily",
  get:
    (coreName: string) =>
    async ({ get }) => {
      const inventory = get(coreInventoryAtom)
      const inventoryItem = inventory.cores.data.find(
        ({ id: identifier }) => coreName === identifier
      )
      if (!inventoryItem) return null
      return inventoryItem.releases[0].download_url
    },
})

export const cateogryListselector = selector<Category[]>({
  key: "CateogryListselector",
  get: ({ get }) => {
    const inventory = get(coreInventoryAtom)
    const deviceCategories = get(allCategoriesSelector)

    const cateogrySet = new Set([
      ...inventory.platforms.data.map(({ category }) => category),
      ...deviceCategories,
    ])

    return ["All", ...Array.from(cateogrySet)]
  },
})

export const PlatformInventoryImageSelectorFamily = selectorFamily<
  string | undefined,
  PlatformId | undefined
>({
  key: "PlatformInventoryImageSelectorFamily",
  get: (platformId) => () =>
    platformId
      ? `https://openfpga-cores-inventory.github.io/analogue-pocket/assets/images/platforms/${platformId}.png`
      : undefined,
})
