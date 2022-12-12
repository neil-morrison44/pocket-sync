import { selector, selectorFamily } from "recoil"
import { PlatformId, PlatformInfoJSON } from "../../types"
import { invokeListFiles, invokeReadTextFile } from "../../utils/invokes"
import { PLATFORM_IMAGE } from "../../values"
import { fileSystemInvalidationAtom } from "../atoms"
import {
  CoreInfoSelectorFamily,
  coresListSelector,
  ImageBinSrcSelectorFamily,
} from "../selectors"

export const platformsListSelector = selector<PlatformId[]>({
  key: "platformsListSelector",
  get: async ({ get }) => {
    get(fileSystemInvalidationAtom)
    const platforms = await invokeListFiles("Platforms")
    return platforms
      .filter((s) => s.endsWith(".json"))
      .map((s) => s.replace(".json", ""))
  },
})

export const CoresForPlatformSelectorFamily = selectorFamily<
  string[],
  PlatformId
>({
  key: "CoresForPlatformSelectorFamily",
  get:
    (platformId: PlatformId) =>
    ({ get }) => {
      const coresList = get(coresListSelector)
      const results = []
      for (const coreId of coresList) {
        const coreData = get(CoreInfoSelectorFamily(coreId))

        if (coreData.core.metadata.platform_ids.includes(platformId)) {
          results.push(coreId)
        }
      }

      return results
    },
})

export const PlatformInfoSelectorFamily = selectorFamily<
  PlatformInfoJSON,
  PlatformId
>({
  key: "PlatformInfoSelectorFamily",
  get:
    (platformId: PlatformId) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const response = await invokeReadTextFile(`Platforms/${platformId}.json`)
      return JSON.parse(response) as PlatformInfoJSON
    },
})

export const PlatformImageSelectorFamily = selectorFamily<string, PlatformId>({
  key: "PlatformImageSelectorFamily",
  get:
    (platformId: PlatformId) =>
    async ({ get }) =>
      get(
        ImageBinSrcSelectorFamily({
          path: `Platforms/_images/${platformId}.bin`,
          width: PLATFORM_IMAGE.WIDTH,
          height: PLATFORM_IMAGE.HEIGHT,
        })
      ),
})

export const allCategoriesSelector = selector<string[]>({
  key: "allCategoriesSelector",
  get: async ({ get }) => {
    get(fileSystemInvalidationAtom)
    const platforms = get(platformsListSelector)

    return Array.from(
      new Set(
        platforms.map((id) => {
          const { platform } = get(PlatformInfoSelectorFamily(id))
          return platform.category
        })
      )
    ).filter((c) => Boolean(c)) as string[]
  },
})
