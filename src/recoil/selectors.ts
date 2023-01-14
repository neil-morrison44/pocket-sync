import { selector, selectorFamily } from "recoil"
import {
  CoreInfoJSON,
  DataJSON,
  InputJSON,
  InstanceDataJSON,
  PocketSyncConfig,
  RequiredFileInfo,
} from "../types"
import { renderBinImage } from "../utils/renderBinImage"
import {
  configInvalidationAtom,
  fileSystemInvalidationAtom,
  pocketPathAtom,
} from "./atoms"
import { getVersion } from "@tauri-apps/api/app"
import { decodeDataParams } from "../utils/decodeDataParams"
import {
  invokeFileExists,
  invokeFindCleanableFiles,
  invokeListFiles,
  invokeReadBinaryFile,
  invokeReadTextFile,
  invokeSaveFile,
  invokeSHA1Hash,
  invokeWalkDirListFiles,
} from "../utils/invokes"
import { AUTHOUR_IMAGE, IGNORE_INSTANCE_JSON_LIST } from "../values"

export const DataJSONSelectorFamily = selectorFamily<DataJSON, string>({
  key: "DataJSONSelectorFamily",
  get:
    (coreName) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const jsonText = await invokeReadTextFile(`Cores/${coreName}/data.json`)
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
        ({ name, required, filename }) => {
          return (
            // not sure why some bioses aren't required
            (required || name?.toLowerCase().includes("bios")) &&
            filename &&
            coreJSON.core.metadata.platform_ids.length === 1
          )
        }
      )

      const fileInfo = await Promise.all(
        requiredCoreFiles.map(async ({ filename, parameters }) => {
          const path = `Assets/${platform_id}/${
            decodeDataParams(parameters).coreSpecific ? coreName : "common"
          }`

          return {
            filename: filename as string,
            path,
            exists: await invokeFileExists(`${path}/${filename}`),
            sha1: await invokeSHA1Hash(`${path}/${filename}`),
            type: "core",
          } satisfies RequiredFileInfo
        })
      )

      if (IGNORE_INSTANCE_JSON_LIST.includes(coreName)) {
        return [...fileInfo]
      }

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

            const path = `Assets/${platform_id}/${
              decodeDataParams(parameters).coreSpecific ? coreName : "common"
            }/`

            const files = await invokeWalkDirListFiles(path, [".json"])

            return await Promise.all(
              files.map(async (f) => {
                const response = await invokeReadTextFile(`${path}/${f}`)
                const instanceFile = JSON.parse(response) as InstanceDataJSON
                const dataPath = instanceFile.instance.data_path

                return await Promise.all(
                  instanceFile.instance.data_slots.map(
                    async ({ filename, parameters }) => {
                      const path = `Assets/${platform_id}/${
                        decodeDataParams(parameters).coreSpecific
                          ? coreName
                          : "common"
                      }${dataPath ? `/${dataPath}` : ""}`

                      return {
                        filename: filename as string,
                        path,
                        exists: await invokeFileExists(`${path}/${filename}`),
                        sha1: await invokeSHA1Hash(`${path}/${filename}`),
                        type: "instance",
                      } satisfies RequiredFileInfo
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

export const coresListSelector = selector<string[]>({
  key: "coresListSelector",
  get: async ({ get }) => {
    get(fileSystemInvalidationAtom)
    return await invokeListFiles("Cores")
  },
})

export const CoreInfoSelectorFamily = selectorFamily<CoreInfoJSON, string>({
  key: "CoreInfoSelectorFamily",
  get:
    (coreName: string) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const response = await invokeReadTextFile(`Cores/${coreName}/core.json`)
      return JSON.parse(response) as CoreInfoJSON
    },
})

export const CoreAuthorImageSelectorFamily = selectorFamily<string, string>({
  key: "CoreAuthorImageSelectorFamily",
  get:
    (coreName: string) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)

      const path = `Cores/${coreName}/icon.bin`
      const width = AUTHOUR_IMAGE.WIDTH
      const height = AUTHOUR_IMAGE.HEIGHT

      const exists = await invokeFileExists(path)

      if (!exists) {
        // https://www.analogue.co/developer/docs/platform-metadata#platform-image
        // A platform _may_ have a graphic associated with it.

        const emptyBuffer = new Uint8Array(width * height * 2)
        return renderBinImage(emptyBuffer, width, height, true)
      }

      const response = await invokeReadBinaryFile(path)
      return await new Promise<string>((resolve) => {
        // @ts-ignore not supported in safari
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

export const AppVersionSelector = selector<string>({
  key: "AppVersionSelector",
  get: async () => await getVersion(),
})

export const PocketSyncConfigSelector = selector<PocketSyncConfig>({
  key: "PocketSyncConfigSelector",
  get: async ({ get }) => {
    get(configInvalidationAtom)
    const pocketPath = get(pocketPathAtom)

    if (!pocketPath) {
      return {
        version: get(AppVersionSelector),
        colour: Math.random() > 0.5 ? "white" : "black",
        archive_url: null,
        saves: [],
      } satisfies PocketSyncConfig
    }

    const exists = await invokeFileExists("pocket-sync.json")
    if (!exists) {
      const defaultConfig = {
        version: get(AppVersionSelector),
        colour: "black",
        archive_url: null,
        saves: [],
      } satisfies PocketSyncConfig

      const encoder = new TextEncoder()

      await invokeSaveFile(
        `${pocketPath}/pocket-sync.json`,
        encoder.encode(JSON.stringify(defaultConfig, null, 2))
      )
    }

    const response = await invokeReadTextFile("pocket-sync.json")
    return JSON.parse(response) as PocketSyncConfig
  },
})

export const WalkDirSelectorFamily = selectorFamily<
  string[],
  { path: string; extensions: string[] }
>({
  key: "WalkDirSelectorFamily",
  get:
    ({ path, extensions }) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const files = await invokeWalkDirListFiles(path, extensions)
      return files
    },
})

export const ImageBinSrcSelectorFamily = selectorFamily<
  string,
  { path: string; width: number; height: number }
>({
  key: "ImageBinSrcSelectorFamily",
  get:
    ({ path, width, height }) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)

      const exists = await invokeFileExists(path)

      if (!exists) {
        // https://www.analogue.co/developer/docs/platform-metadata#platform-image
        // A platform _may_ have a graphic associated with it.

        const emptyBuffer = new Uint8Array(width * height * 2)
        return renderBinImage(emptyBuffer, width, height, true)
      }

      const response = await invokeReadBinaryFile(path)

      return await new Promise<string>((resolve) => {
        // @ts-ignore not supported in safari
        if (window.requestIdleCallback) {
          requestIdleCallback(
            () => {
              resolve(renderBinImage(response, width, height, true))
            },
            { timeout: 1000 }
          )
        } else {
          resolve(renderBinImage(response, width, height, true))
        }
      })
    },
})

export const CleanableFilesSelectorFamily = selectorFamily<string[], string>({
  key: "CleanableFilesSelectorFamily",
  get:
    (path) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const files = await invokeFindCleanableFiles(path)
      return files
    },
})
