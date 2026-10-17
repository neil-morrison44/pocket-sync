import { Category, PlatformId, PlatformInfoJSON } from "../../types"
import { allCategoriesSelector } from "../platforms/selectors"
import { coreInventoryAtom } from "./atoms"
import { atomFamily } from "jotai-family"
import { atom, Atom } from "jotai"

export const inventoryCoreListAtom = atom<Promise<string[]>>(async (get) => {
  const inventory = await get(coreInventoryAtom)
  return inventory.cores.data.map(({ id }) => id)
})

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

/** Platforms that at least one core runs, sorted by manufacturer and name. */
export const corePlatformListSelector = atom<
  Promise<{ id: PlatformId; name: string; manufacturer: string }[]>
>(async (get) => {
  const inventory = await get(coreInventoryAtom)
  const usedIds = new Set(
    inventory.cores.data.flatMap(
      ({ releases }) => releases[0]?.core.metadata.platform_ids ?? []
    )
  )
  return inventory.platforms.data
    .filter(({ id }) => usedIds.has(id))
    .map(({ id, name, manufacturer }) => ({ id, name, manufacturer }))
    .sort(
      (a, b) =>
        a.manufacturer.localeCompare(b.manufacturer) ||
        a.name.localeCompare(b.name)
    )
})
