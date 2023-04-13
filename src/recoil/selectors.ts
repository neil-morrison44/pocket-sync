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
