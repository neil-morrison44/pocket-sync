import { selector, selectorFamily } from "recoil"
import {
  CoreInfoJSON,
  DataJSON,
  InstanceDataJSON,
  PlatformId,
  PlatformInfoJSON,
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
  invokeListFiles,
  invokeReadBinaryFile,
  invokeReadTextFile,
  invokeSaveFile,
  invokeWalkDirListFiles,
} from "../utils/invokes"

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
          const path = decodeDataParams(parameters).coreSpecific
            ? `Assets/${platform_id}/${coreName}`
            : `Assets/${platform_id}/common`

          return {
            filename: filename as string,
            path,
            exists: await invokeFileExists(`${path}/${filename}`),
            type: "core",
          } as RequiredFileInfo
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

            const files = await invokeWalkDirListFiles(path, [".json"])

            return await Promise.all(
              files.map(async (f) => {
                const response = await invokeReadTextFile(`${path}/${f}`)
                const instanceFile = JSON.parse(response) as InstanceDataJSON
                const dataPath = instanceFile.instance.data_path

                return await Promise.all(
                  instanceFile.instance.data_slots.map(
                    async ({ filename, parameters }) => {
                      const path = decodeDataParams(parameters).coreSpecific
                        ? `Assets/${platform_id}/${coreName}${
                            dataPath ? `/${dataPath}` : ""
                          }`
                        : `Assets/${platform_id}/common${
                            dataPath ? `/${dataPath}` : ""
                          }`

                      return {
                        filename: filename as string,
                        path,
                        exists: await invokeFileExists(`${path}/${filename}`),
                        type: "instance",
                      } as RequiredFileInfo
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
      const response = await invokeReadBinaryFile(`Cores/${coreName}/icon.bin`)
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

export const PlatformImageSelectorFamily = selectorFamily<string, PlatformId>({
  key: "PlatformImageSelectorFamily",
  get:
    (platformId: PlatformId) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const response = await invokeReadBinaryFile(
        `Platforms/_images/${platformId}.bin`
      )

      return await new Promise<string>((resolve) => {
        // @ts-ignore not supported in safari
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

export const platformsListSelector = selector<PlatformId[]>({
  key: "platformsListSelector",
  get: async ({ get }) => {
    get(fileSystemInvalidationAtom)
    return await invokeListFiles("Platforms")
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
      } as PocketSyncConfig
    }

    const exists = await invokeFileExists("pocket-sync.json")
    if (!exists) {
      const defaultConfig = {
        version: get(AppVersionSelector),
        colour: "black",
        archive_url: null,
        saves: [],
      } as PocketSyncConfig

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
