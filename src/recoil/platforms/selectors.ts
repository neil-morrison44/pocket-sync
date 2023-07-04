import { selector, selectorFamily } from "recoil"
import { ImagePack, PlatformId, PlatformInfoJSON } from "../../types"
import { invokeListFiles } from "../../utils/invokes"
import { PLATFORM_IMAGE } from "../../values"
import { fileSystemInvalidationAtom } from "../atoms"
import {
  CoreInfoSelectorFamily,
  coresListSelector,
  ImageBinSrcSelectorFamily,
} from "../selectors"
import * as zip from "@zip.js/zip.js"
import { renderBinImage } from "../../utils/renderBinImage"
import { getClient, ResponseType } from "@tauri-apps/api/http"
import { readJSONFile } from "../../utils/readJSONFile"
import { http } from "@tauri-apps/api"

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
      return readJSONFile<PlatformInfoJSON>(`Platforms/${platformId}.json`)
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

export const imagePackListSelector = selector<ImagePack[]>({
  key: "imagePackListSelector",
  get: async () => {
    try {
      const httpClient = await getClient()
      // TODO: see about getting this moved to the inventory org
      const response = await httpClient.get<ImagePack[]>(
        "https://raw.githubusercontent.com/mattpannella/pocket-updater-utility/main/image_packs.json",
        {
          timeout: 30,
          responseType: ResponseType.JSON,
        }
      )

      return response.data
    } catch (e) {
      return []
    }
  },
})

export const ImagePackBlobSelectorFamily = selectorFamily<
  Blob | null,
  ImagePack
>({
  key: "ImagePackFileSelectorFamily",
  get:
    ({ owner, repository, variant }) =>
    async () => {
      const latestRelease = (await (
        await fetch(
          `https://api.github.com/repos/${owner}/${repository}/releases/latest`
        )
      ).json()) as { assets: [{ name: string; browser_download_url: string }] }

      const downloadURL = latestRelease.assets.find(({ name }) => {
        if (!name.endsWith(".zip")) return false
        if (variant) return name.includes(variant)
        return true
      })

      if (!downloadURL) return null

      const httpClient = await getClient()

      const fileResponse = await httpClient.get<number[]>(
        downloadURL.browser_download_url,
        {
          timeout: 60,
          responseType: ResponseType.Binary,
        }
      )

      const fileBlob = new Blob([new Uint8Array(fileResponse.data)], {
        type: "application/zip",
      })

      return fileBlob
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
      const zipBlob = get(
        ImagePackBlobSelectorFamily({ owner, repository, variant })
      )

      if (!zipBlob) return null

      const abortController = new AbortController()
      const entries = await new zip.ZipReader(new zip.BlobReader(zipBlob), {
        signal: abortController.signal,
      }).getEntries({})

      const platformJsonEntry = entries.find((e) =>
        e.filename.endsWith(`Platforms/${platformId}.json`)
      )

      if (!platformJsonEntry || !platformJsonEntry.getData) return null
      const data = await platformJsonEntry.getData(new zip.BlobWriter(), {})
      const text = await data.text()

      return JSON.parse(text)
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
      const zipBlob = get(
        ImagePackBlobSelectorFamily({ owner, repository, variant })
      )

      if (!zipBlob) return null

      const abortController = new AbortController()
      const entries = await new zip.ZipReader(new zip.BlobReader(zipBlob), {
        signal: abortController.signal,
      }).getEntries({})

      const platformImageEntry = entries.find((e) =>
        e.filename.endsWith(`Platforms/_images/${platformId}.bin`)
      )

      if (!platformImageEntry || !platformImageEntry.getData) return null
      const data = await platformImageEntry.getData(new zip.BlobWriter(), {})

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
