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
import { Atom, atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { atomFamilyDeepEqual } from "../../utils/jotai"

export const platformsListSelector = atom<Promise<PlatformId[]>>(
  async (get) => {
    get(FolderWatchAtomFamily("Platforms"))
    const platforms = await invokeListFiles("Platforms")
    return platforms
      .filter((s) => s.endsWith(".json"))
      .map((s) => s.replace(".json", ""))
  }
)

export const platformsWithoutCoresSelector = atom<Promise<PlatformId[]>>(
  async (get) => {
    const platforms = await get(platformsListSelector)
    return (
      await Promise.all(
        platforms.map(async (pId) => get(CoresForPlatformSelectorFamily(pId)))
      )
    )
      .filter((cores) => cores.length === 0)
      .flat()
  }
)

export const CoresForPlatformSelectorFamily = atomFamily<
  PlatformId,
  Atom<Promise<string[]>>
>((platformId: PlatformId) =>
  atom(async (get) => {
    const coresList = await get(coresListSelector)
    const results: string[] = []
    for (const coreId of coresList) {
      const coreData = await get(CoreInfoSelectorFamily(coreId))

      if (coreData.core.metadata.platform_ids.includes(platformId)) {
        results.push(coreId)
      }
    }

    return results
  })
)

export const PlatformExistsSelectorFamily = atomFamily<
  PlatformId,
  Atom<Promise<boolean>>
>((platformId: PlatformId) =>
  atom(async (get) => {
    const path = `Platforms/${platformId}.json`
    get(FileWatchAtomFamily(path))
    return await invokeFileExists(path)
  })
)

export const PlatformInfoSelectorFamily = atomFamily<
  PlatformId,
  Atom<Promise<PlatformInfoJSON>>
>((platformId: PlatformId) =>
  atom(async (get) => {
    const path = `Platforms/${platformId}.json`
    get(FileWatchAtomFamily(path))
    const exists = await invokeFileExists(path)
    if (!exists)
      throw new Error(`Missing File: ${path}`, {
        cause: {
          type: "missing_platform",
          platform_id: platformId,
          repairable: true,
        },
      })
    return readJSONFile<PlatformInfoJSON>(path)
  })
)

export const PlatformImageSelectorFamily = atomFamily<
  PlatformId,
  Atom<Promise<string>>
>((platformId: PlatformId) =>
  atom(async (get) =>
    get(
      ImageBinSrcSelectorFamily({
        path: `Platforms/_images/${platformId}.bin`,
        width: PLATFORM_IMAGE.WIDTH,
        height: PLATFORM_IMAGE.HEIGHT,
      })
    )
  )
)

export const allCategoriesSelector = atom<Promise<string[]>>(async (get) => {
  const platforms = await get(platformsListSelector)

  return Array.from(
    new Set(
      await Promise.all(
        platforms.map(async (id) => {
          const { platform } = await get(PlatformInfoSelectorFamily(id))
          return platform.category
        })
      )
    )
  ).filter((c) => Boolean(c)) as string[]
})

export const imagePackListSelector = atom<Promise<ImagePack[]>>(
  async (_get, { signal }) => {
    try {
      const response = await tauriFecth(
        "https://neil-morrison44.github.io/pocket-sync/image_packs.json",
        {
          method: "GET",
          connectTimeout: 30e3,
          signal,
        }
      )

      const packs = (await response.json()) as ImagePack[]
      return packs
    } catch (err) {
      console.error(err)
      return []
    }
  }
)

const mergedPlatformFileBlobsSelector = atom<
  Promise<Record<string, Blob | undefined> | null>
>(async (_get, { signal }) => {
  const platformsZip = await (
    await fetch(`https://neil-morrison44.github.io/pocket-sync/platforms.zip`, {
      signal,
    })
  ).blob()
  const entries = await new zip.ZipReader(new zip.BlobReader(platformsZip), {
    signal,
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
})

export const DataPackJsonSelectorFamily = atomFamilyDeepEqual<
  ImagePack & {
    platformId: PlatformId
  },
  Atom<Promise<PlatformInfoJSON | null>>
>(({ owner, repository, variant, platformId }) =>
  atom(async (get) => {
    const fileBlobs = await get(mergedPlatformFileBlobsSelector)
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
  })
)

export const ImagePackImageSelectorFamily = atomFamilyDeepEqual<
  Omit<ImagePack, "image_platforms" | "data_platforms"> & {
    platformId: PlatformId
  },
  Atom<Promise<{ imageSrc: string; file: Blob } | null>>
>(({ owner, repository, variant, platformId }) =>
  atom(async (get) => {
    const fileBlobs = await get(mergedPlatformFileBlobsSelector)
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
  })
)
