import { selector, selectorFamily } from "recoil"
import { ImagePack, PlatformId, PlatformInfoJSON } from "../../types"
import { invokeFileExists, invokeListFiles } from "../../utils/invokes"
import { PLATFORM_IMAGE } from "../../values"
import {
  CoreInfoSelectorFamily,
  coresListSelector,
  ImageBinSrcSelectorFamily,
} from "../selectors"
import * as zip from "@zip.js/zip.js"
import { renderBinImage } from "../../utils/renderBinImage"
import { fetch as tauriFecth } from "@tauri-apps/plugin-http"
import { readJSONFile } from "../../utils/readJSONFile"
import { FileWatchAtomFamily, FolderWatchAtomFamily } from "../fileSystem/atoms"

export const platformsListSelector = selector<PlatformId[]>({
  key: "platformsListSelector",
  get: async ({ get }) => {
    get(FolderWatchAtomFamily("Platforms"))
    const platforms = await invokeListFiles("Platforms")
    return platforms
      .filter((s) => s.endsWith(".json"))
      .map((s) => s.replace(".json", ""))
  },
})

export const platformsWithoutCoresSelector = selector<PlatformId[]>({
  key: "platformsWithoutCoresSelector",
  get: async ({ get }) => {
    const platforms = get(platformsListSelector)
    return platforms.filter((platformId) => {
      const cores = get(CoresForPlatformSelectorFamily(platformId))
      return cores.length === 0
    })
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
      const results: string[] = []
      for (const coreId of coresList) {
        const coreData = get(CoreInfoSelectorFamily(coreId))

        if (coreData.core.metadata.platform_ids.includes(platformId)) {
          results.push(coreId)
        }
      }

      return results
    },
})

export const PlatformExistsSelectorFamily = selectorFamily<boolean, PlatformId>(
  {
    key: "PlatformExistsSelectorFamily",
    get:
      (platformId: PlatformId) =>
      async ({ get }) => {
        const path = `Platforms/${platformId}.json`
        get(FileWatchAtomFamily(path))
        return await invokeFileExists(path)
      },
  }
)

export const PlatformInfoSelectorFamily = selectorFamily<
  PlatformInfoJSON,
  PlatformId
>({
  key: "PlatformInfoSelectorFamily",
  get:
    (platformId: PlatformId) =>
    async ({ get }) => {
      const path = `Platforms/${platformId}.json`
      get(FileWatchAtomFamily(path))
      const exists = await invokeFileExists(path)
      if (!exists) throw new Error(`Attempt to read platform_id ${platformId}`)
      return readJSONFile<PlatformInfoJSON>(path)
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

export const imagePackListSelector = selector<ImagePack[]>({
  key: "imagePackListSelector",
  get: async () => {
    try {
      const response = await tauriFecth(
        "https://neil-morrison44.github.io/pocket-sync/image_packs.json",
        {
          method: "GET",
          connectTimeout: 30,
        }
      )

      const packs = (await response.json()) as ImagePack[]
      return packs
    } catch (err) {
      console.error(err)
      return []
    }
  },
})

const mergedPlatformFileBlobsSelector = selector<Record<
  string,
  Blob | undefined
> | null>({
  key: "MergedPlatformFileBlobsSelectorFamily",
  get: async () => {
    const platformsZip = await (
      await fetch(`https://neil-morrison44.github.io/pocket-sync/platforms.zip`)
    ).blob()

    const abortController = new AbortController()
    const entries = await new zip.ZipReader(new zip.BlobReader(platformsZip), {
      signal: abortController.signal,
    }).getEntries({})

    // Give the UI a chance before we start chugging through all the entries
    await new Promise<void>((resolve) => setTimeout(resolve, 10))

    return Object.fromEntries(
      await Promise.all(
        entries
          .filter((e) => e && e.getData)
          .map((entry) =>
            // @ts-ignore already filtering out the non-entry ones
            entry
              .getData(new zip.BlobWriter(), {})
              .then((blob) => [entry.filename, blob])
          )
      )
    )

    // return entries
  },
})

export const DataPackJsonSelectorFamily = selectorFamily<
  PlatformInfoJSON | null,
  ImagePack & {
    platformId: PlatformId
  }
>({
  key: "DataPackJsonSelectorFamily",
  get:
    ({ owner, repository, variant, platformId }) =>
    async ({ get }) => {
      const fileBlobs = get(mergedPlatformFileBlobsSelector)
      if (!fileBlobs) return null

      const packPath = `${owner}__${repository}__${variant || "default"}`
      const data = fileBlobs[`${packPath}/Platforms/${platformId}.json`]
      if (!data) return null
      const text = await data.text()
      let parsed: PlatformInfoJSON | null = null

      try {
        parsed = JSON.parse(text)
      } catch (err) {
        console.warn(
          `Data Pack Error: ${JSON.stringify({
            owner,
            repository,
            variant,
            platformId,
          })}`,
          err
        )
      }

      return parsed
    },
})

export const ImagePackImageSelectorFamily = selectorFamily<
  { imageSrc: string; file: Blob } | null,
  ImagePack & {
    platformId: PlatformId
  }
>({
  key: "ImagePackImageSelectorFamily",
  get:
    ({ owner, repository, variant, platformId }) =>
    async ({ get }) => {
      const fileBlobs = get(mergedPlatformFileBlobsSelector)
      if (!fileBlobs) return null

      const packPath = `${owner}__${repository}__${variant || "default"}`
      const data = fileBlobs[`${packPath}/Platforms/_images/${platformId}.bin`]
      if (!data) return null

      return {
        imageSrc: renderBinImage(
          new Uint8Array(await data.arrayBuffer()),
          PLATFORM_IMAGE.WIDTH,
          PLATFORM_IMAGE.HEIGHT,
          true
        ),
        file: data,
      }
    },
})
