import { selector, selectorFamily } from "recoil"
import { invoke } from "@tauri-apps/api/tauri"
import {
  CoreInfoJSON,
  DataJSON,
  InstanceDataJSON,
  PlatformId,
  PlatformInfoJSON,
  RequiredFileInfo,
  Screenshot,
  VideoJSON,
} from "../types"
import { renderBinImage } from "../components/utils/renderBinImage"
import { fileSystemInvalidationAtom } from "./atoms"
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

export const AppVersionSelector = selector<string>({
  key: "AppVersionSelector",
  get: async () => await getVersion(),
})
