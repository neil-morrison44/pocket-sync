import { selector, selectorFamily } from "recoil"
import { invoke } from "@tauri-apps/api/tauri"
import {
  Category,
  CoreInfoJSON,
  DataJSON,
  GithubRelease,
  InstanceDataJSON,
  InventoryJSON,
  PlatformId,
  PlatformInfoJSON,
  RequiredFileInfo,
  Screenshot,
  VideoJSON,
} from "../types"
import { renderBinImage } from "../components/utils/renderBinImage"
import { fileSystemInvalidationAtom, iventoryInvalidationAtom } from "./atoms"
import { getVersion } from "@tauri-apps/api/app"
import { decodeDataParams } from "../components/utils/decodeDataParams"

export const VideoJSONSelectorFamily = selectorFamily<VideoJSON, string>({
  key: "VideoJSONSelectorFamily",
  get:
    (coreName) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const jsonText = await invoke<string>("read_text_file", {
        path: `Cores/${coreName}/video.json`,
      })

      return JSON.parse(jsonText) as VideoJSON
    },
})

export const DataJSONSelectorFamily = selectorFamily<DataJSON, string>({
  key: "DataJSONSelectorFamily",
  get:
    (coreName) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const jsonText = await invoke<string>("read_text_file", {
        path: `Cores/${coreName}/data.json`,
      })

      return JSON.parse(jsonText) as DataJSON
    },
})

export const RequiredFileInfoSelectorFamily = selectorFamily<
  RequiredFileInfo[],
  string
>({
  key: "DataJSONSelectorFamily",
  get:
    (coreName) =>
    async ({ get }) => {
      const dataJSON = get(DataJSONSelectorFamily(coreName))
      const coreJSON = get(CoreInfoSelectorFamily(coreName))
      const [platform_id] = coreJSON.core.metadata.platform_ids

      const requiredCoreFiles = dataJSON.data.data_slots.filter(
        ({ required, filename }) => {
          return (
            required &&
            filename &&
            coreJSON.core.metadata.platform_ids.length === 1
          )
        }
      )

      const fileInfo = await Promise.all(
        requiredCoreFiles.map(async ({ filename, parameters }) => {
          const path = decodeDataParams(parameters).coreSpecific
            ? `Assets/${platform_id}/${coreName}`
            : `Assets/${platform_id}/common`

          return {
            filename: filename as string,
            path,
            exists: await invoke<boolean>("file_exists", {
              path: `${path}/${filename}`,
            }),
            type: "core",
          }
        })
      )

      const instanceFileInfo = await Promise.all(
        dataJSON.data.data_slots
          .filter(({ required, parameters }) => {
            return (
              required &&
              decodeDataParams(parameters).instanceJSON &&
              coreJSON.core.metadata.platform_ids.length === 1
            )
          })
          .map(async ({ filename, parameters }) => {
            if (filename) {
              // can't handle this yet
              console.log("is a single filename")
            }

            const path = decodeDataParams(parameters).coreSpecific
              ? `Assets/${platform_id}/${coreName}/`
              : `Assets/${platform_id}/common/`

            const files = await invoke<string[]>("walkdir_list_files", {
              path,
              extension: ".json",
            })

            console.log({ files })

            return await Promise.all(
              files.map(async (f) => {
                const response = await invoke<string>("read_text_file", {
                  path: `${path}/${f}`,
                })

                const instanceFile = JSON.parse(response) as InstanceDataJSON
                const dataPath = instanceFile.instance.data_path

                console.log({ instanceFile })

                return await Promise.all(
                  instanceFile.instance.data_slots.map(
                    async ({ filename, parameters }) => {
                      console.log(decodeDataParams(parameters))

                      const path = decodeDataParams(parameters).coreSpecific
                        ? `Assets/${platform_id}/${coreName}`
                        : `Assets/${platform_id}/common`

                      const fullPath = dataPath
                        ? `${path}/${dataPath}/${filename}`
                        : `${path}/${filename}`

                      return {
                        filename: filename as string,
                        path: fullPath,
                        exists: await invoke<boolean>("file_exists", {
                          path: fullPath,
                        }),
                        type: "instance",
                      }
                    }
                  )
                )
              })
            )
          })
      )

      return [...fileInfo, ...instanceFileInfo.flat(3)]
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

export const PlatformInfoSelectorFamily = selectorFamily<
  PlatformInfoJSON,
  PlatformId
>({
  key: "PlatformInfoSelectorFamily",
  get:
    (platformId: PlatformId) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const response = await invoke<string>("read_text_file", {
        path: `Platforms/${platformId}.json`,
      })

      return JSON.parse(response) as PlatformInfoJSON
    },
})

export const CoreInventorySelector = selector<InventoryJSON>({
  key: "CoreInventorySelector",
  get: async ({ get }) => {
    get(iventoryInvalidationAtom)
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

        const regex = new RegExp(`[^a-zA-Z0-9]${simpleCore}[^a-zA-Z0-9]`)
        return name.endsWith(".zip") && regex.test(simpleName)
      })

      if (!coreZip) return null

      return coreZip.browser_download_url
    },
})

export const AppVersionSelector = selector<string>({
  key: "AppVersionSelector",
  get: async () => await getVersion(),
})

export const CateogryListselector = selector<Category[]>({
  key: "CateogryListselector",
  get: ({ get }) => {
    const inventory = get(CoreInventorySelector)

    const cateogrySet = new Set(
      inventory.data.map(({ release, prerelease }) => {
        const releaseDetails = release ?? prerelease
        if (!releaseDetails) return "Uncategorized"
        const { platform } = releaseDetails
        return platform.category ?? "Uncategorized"
      })
    )

    return ["All", ...Array.from(cateogrySet)]
  },
})
