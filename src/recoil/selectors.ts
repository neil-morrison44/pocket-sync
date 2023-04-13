import { selector, selectorFamily } from "recoil"
import {
  CoreInfoJSON,
  DataJSON,
  InstanceDataJSON,
  RequiredFileInfo,
} from "../types"
import { renderBinImage } from "../utils/renderBinImage"
import { fileSystemInvalidationAtom } from "./atoms"
import { getVersion } from "@tauri-apps/api/app"
import { decodeDataParams } from "../utils/decodeDataParams"
import {
  invokeFileExists,
  invokeFileMetadata,
  invokeFindCleanableFiles,
  invokeListFiles,
  invokeReadBinaryFile,
  invokeWalkDirListFiles,
} from "../utils/invokes"
import { AUTHOUR_IMAGE, IGNORE_INSTANCE_JSON_LIST } from "../values"
import { readJSONFile } from "../utils/readJSONFile"
import { skipAlternateAssetsSelector } from "./config/selectors"

export const DataJSONSelectorFamily = selectorFamily<DataJSON, string>({
  key: "DataJSONSelectorFamily",
  get:
    (coreName) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      return readJSONFile<DataJSON>(`Cores/${coreName}/data.json`)
    },
})

const SingleRequiredFileInfo = selectorFamily<
  RequiredFileInfo,
  { filename: string | undefined; path: string; type: "core" | "instance" }
>({
  key: "SingleRequiredFileInfo",
  get:
    ({ filename, path, type }) =>
    async (get) => {
      if (!filename) throw new Error("Attempting to find empty file")

      const fullPath = `${path}/${filename}`
      const exists = await invokeFileExists(fullPath)
      const crc32 = exists
        ? (await invokeFileMetadata(fullPath)).crc32
        : undefined

      return {
        filename,
        path,
        exists,
        crc32,
        type,
      }
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

      const fileInfo = (
        await Promise.all(
          requiredCoreFiles.map(
            async ({ filename, alternate_filenames, parameters }) => {
              const path = `Assets/${platform_id}/${
                decodeDataParams(parameters).coreSpecific ? coreName : "common"
              }`

              return Promise.all(
                [filename, ...(alternate_filenames || [])].map(
                  async (filename) =>
                    get(
                      SingleRequiredFileInfo({ filename, path, type: "core" })
                    )
                )
              )
            }
          )
        )
      ).flat()

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

            let files = await invokeWalkDirListFiles(path, [".json"])

            if (get(skipAlternateAssetsSelector))
              files = files.filter((path) => !path.includes("_alternatives"))

            return await Promise.all(
              files.map(async (f) => {
                const instanceFile = await readJSONFile<InstanceDataJSON>(
                  `${path}/${f}`
                )

                const dataPath = instanceFile.instance.data_path

                return await Promise.all(
                  instanceFile.instance.data_slots.map(
                    async ({ filename, parameters }) => {
                      const path = `Assets/${platform_id}/${
                        decodeDataParams(parameters).coreSpecific
                          ? coreName
                          : "common"
                      }${dataPath ? `/${dataPath}` : ""}`

                      return get(
                        SingleRequiredFileInfo({
                          filename,
                          path,
                          type: "instance",
                        })
                      )
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
      return readJSONFile<CoreInfoJSON>(`Cores/${coreName}/core.json`)
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
