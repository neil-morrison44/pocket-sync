import { selector, selectorFamily } from "recoil"
import { CoreInfoJSON, DataJSON } from "../types"
import { renderBinImage } from "../utils/renderBinImage"
import { fileSystemInvalidationAtom } from "./atoms"
import { getVersion } from "@tauri-apps/api/app"
import {
  invokeFileExists,
  invokeFindCleanableFiles,
  invokeListFiles,
  invokeReadBinaryFile,
  invokeWalkDirListFiles,
} from "../utils/invokes"
import { AUTHOUR_IMAGE } from "../values"
import { readJSONFile } from "../utils/readJSONFile"
import { path } from "@tauri-apps/api"

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

export const CoreMainPlatformIdSelectorFamily = selectorFamily<string, string>({
  key: "CoreMainPlatformIdSelectorFamily",
  get:
    (coreName: string) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const { core } = get(CoreInfoSelectorFamily(coreName))
      // Hopefully 0 is the one that exists
      return core.metadata.platform_ids[0]
    },
})

export const CorePlatformIdSelectorFamily = selectorFamily<string, string>({
  key: "CorePlatformIdSelectorFamily",
  get:
    (coreName: string) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const { core } = get(CoreInfoSelectorFamily(coreName))
      // Hopefully 0 is the one that exists
      return core.metadata.platform_ids[0]
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
  { path: string; extensions: string[]; offPocket?: boolean }
>({
  key: "WalkDirSelectorFamily",
  get:
    ({ path, extensions, offPocket = false }) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const files = await invokeWalkDirListFiles(path, extensions, offPocket)
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

export const homeDirSelector = selector<string>({
  key: "homeDirSelector",
  get: () => path.homeDir(),
})
