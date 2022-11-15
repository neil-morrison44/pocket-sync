import { selector, selectorFamily } from "recoil"
import { invoke } from "@tauri-apps/api/tauri"
import {
  CoreInfoJSON,
  GithubRelease,
  InventoryJSON,
  PlatformId,
  Screenshot,
  VideoJSON,
} from "../types"
import { renderBinImage } from "../components/utils/renderBinImage"
import { fileSystemInvalidationAtom } from "./atoms"
import { getVersion } from "@tauri-apps/api/app"

export const VideoJSONSelectorFamily = selectorFamily<
  VideoJSON,
  { authorName: string; coreName: string }
>({
  key: "VideoJSONSelectorFamily",
  get:
    ({ authorName, coreName }) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const jsonText = await invoke<string>("read_text_file", {
        path: `Cores/${authorName}.${coreName}/video.json`,
      })

      return JSON.parse(jsonText) as VideoJSON
    },
})

export const screenshotsListSelector = selector<string[]>({
  key: "screenshotsListSelector",
  get: async ({ get }) => {
    get(fileSystemInvalidationAtom)
    return await invoke<string[]>("list_files", {
      path: "Memories/Screenshots",
    })
  },
})

export const SingleScreenshotSelectorFamily = selectorFamily<
  Screenshot | null,
  string
>({
  key: "SingleScreenshotSelectorFamily",
  get:
    (fileName) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)

      const data = await invoke<number[]>("read_binary_file", {
        path: `Memories/Screenshots/${fileName}`,
      })
      const buf = new Uint8Array(data)
      const file = new File([buf], fileName, { type: "image/png" })
      const metadataBuffer = buf.slice(buf.length - 528)

      let utf8decoder = new TextDecoder()
      // The unpacking here might not be right if there's unused ranges

      let authorName = utf8decoder
        .decode(metadataBuffer.slice(0, 16 * 2))
        .replaceAll("\u0000", "")

      let coreName = utf8decoder
        .decode(metadataBuffer.slice(16 * 2, 16 * 4))
        .trim()
        .replaceAll("\u0000", "")

      let gameName = utf8decoder
        .decode(metadataBuffer.slice(16 * 6, 16 * 20))
        .trim()
        .replaceAll("\u0000", "")

      let platformName = utf8decoder
        .decode(metadataBuffer.slice(metadataBuffer.length - 16 * 10))
        .replaceAll("\u0000", "")

      return {
        file_name: fileName,
        file,
        game: gameName,
        platform: platformName,
        timestamp: new Date(file.lastModified),
        author: authorName,
        core: coreName,
      }
    },
})

export const coresListSelector = selector<string[]>({
  key: "coresListSelector",
  get: async ({ get }) => {
    get(fileSystemInvalidationAtom)
    return await invoke<string[]>("list_files", { path: "Cores" })
  },
})

export const CoreInfoSelectorFamily = selectorFamily<CoreInfoJSON, string>({
  key: "CoreInfoSelectorFamily",
  get:
    (coreName: string) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const response = await invoke<string>("read_text_file", {
        path: `Cores/${coreName}/core.json`,
      })

      return JSON.parse(response) as CoreInfoJSON
    },
})

export const CoreAuthorImageSelectorFamily = selectorFamily<string, string>({
  key: "CoreAuthorImageSelectorFamily",
  get:
    (coreName: string) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const response = await invoke<Uint8Array>("read_binary_file", {
        path: `Cores/${coreName}/icon.bin`,
      })

      return await new Promise<string>((resolve) => {
        // not supported in safari
        if (window.requestIdleCallback) {
          requestIdleCallback(
            () => {
              resolve(renderBinImage(response, 36, 36, true))
            },
            { timeout: 1000 }
          )
        } else {
          resolve(renderBinImage(response, 36, 36, true))
        }
      })
    },
})

export const PlatformImageSelectorFamily = selectorFamily<string, PlatformId>({
  key: "PlatformImageSelectorFamily",
  get:
    (platformId: PlatformId) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const response = await invoke<Uint8Array>("read_binary_file", {
        path: `Platforms/_images/${platformId}.bin`,
      })

      return await new Promise<string>((resolve) => {
        // not supported in safari
        if (window.requestIdleCallback) {
          requestIdleCallback(
            () => {
              resolve(renderBinImage(response, 521, 165, true))
            },
            { timeout: 1000 }
          )
        } else {
          resolve(renderBinImage(response, 521, 165, true))
        }
      })
    },
})

export const CoreInventorySelector = selector<InventoryJSON>({
  key: "CoreInventorySelector",
  get: async () => {
    const response = await fetch(
      "https://joshcampbell191.github.io/openfpga-cores-inventory/api/v1/analogue-pocket/cores.json"
    )
    return await response.json()
  },
})

export const GithubReleasesSelectorFamily = selectorFamily<
  GithubRelease[],
  { owner: string; repo: string }
>({
  key: "GithubReleasesSelectorFamily",
  get:
    ({ owner, repo }) =>
    async () => {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/releases`
      )

      return (await response.json()) as GithubRelease[]
    },
})

export const DownloadURLSelectorFamily = selectorFamily<string | null, string>({
  key: "DownloadURLSelectorFamily",
  get:
    (coreName: string) =>
    async ({ get }) => {
      const inventory = get(CoreInventorySelector)
      const inventoryItem = inventory.data.find(
        ({ identifier }) => coreName === identifier
      )
      if (!inventoryItem || inventoryItem.repository.platform !== "github")
        return null

      const { owner, name: repo } = inventoryItem.repository

      const githubReleaseList = get(
        GithubReleasesSelectorFamily({ owner, repo })
      )

      const zips = githubReleaseList[0].assets.filter(({ name }) =>
        name.endsWith(".zip")
      )

      if (zips.length === 1) return zips[0].browser_download_url

      const coreZip = githubReleaseList[0].assets.find(({ name }) => {
        // hopefully this doesn't get used much
        const [_, core] = coreName.split(".")
        const simpleCore = core.replace(/[^\x00-\x7F]/g, "").toLowerCase()
        const simpleName = name.replace(/[^\x00-\x7F]/g, "").toLowerCase()
        return name.endsWith(".zip") && simpleName.includes(simpleCore)
      })

      if (!coreZip) return null

      return coreZip.browser_download_url
    },
})

export const AppVersionSelector = selector<string>({
  key: "AppVersionSelector",
  get: async () => await getVersion(),
})
