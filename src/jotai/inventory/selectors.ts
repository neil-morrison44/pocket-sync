import { Category, PlatformId, PlatformInfoJSON } from "../../types"
import { allCategoriesSelector } from "../platforms/selectors"
import { coreInventoryAtom } from "./atoms"
import { atomFamily } from "jotai/utils"
import { atom, Atom } from "jotai"

export const CorePlatformSelectorFamily = atomFamily<
  PlatformId,
  Atom<Promise<PlatformInfoJSON["platform"] | null>>
>((platformId: PlatformId) =>
  atom(async (get) => {
    const inventory = await get(coreInventoryAtom)
    const platform = inventory.platforms.data.find(
      ({ id }) => id === platformId
    )
    return platform ?? null
  })
)

export const DownloadURLSelectorFamily = atomFamily<
  string,
  Atom<Promise<string | null>>
>((coreName: string) =>
  atom(async (get) => {
    const inventory = await get(coreInventoryAtom)
    const inventoryItem = inventory.cores.data.find(
      ({ id: identifier }) => coreName === identifier
    )
    if (!inventoryItem) return null
    return inventoryItem.releases[0].download_url
  })
)

export const cateogryListselector = atom<Promise<Category[]>>(async (get) => {
  const inventory = await get(coreInventoryAtom)
  const deviceCategories = await get(allCategoriesSelector)

  const cateogrySet = new Set([
    ...inventory.platforms.data.map(({ category }) => category),
    ...deviceCategories,
  ])

  return ["All", ...Array.from(cateogrySet)]
})

export const PlatformInventoryImageSelectorFamily = atomFamily<
  PlatformId | undefined,
  Atom<string | undefined>
>((platformId) =>
  atom(() =>
    platformId
      ? `https://openfpga-library.github.io/analogue-pocket/assets/images/platforms/${platformId}.png`
      : undefined
  )
)
