import { CoreInfoJSON, DataJSON } from "../types"
import { renderBinImage } from "../utils/renderBinImage"
import { getVersion } from "@tauri-apps/api/app"
import {
  invokeFileExists,
  invokeFindCleanableFiles,
  invokeListFolders,
  invokeReadBinaryFile,
  invokeWalkDirListFiles,
} from "../utils/invokes"
import { AUTHOUR_IMAGE } from "../values"
import { readJSONFile } from "../utils/readJSONFile"
import { path } from "@tauri-apps/api"
import { FileWatchAtomFamily, FolderWatchAtomFamily } from "./fileSystem/atoms"
import { getCurrentWindow, Window } from "@tauri-apps/api/window"
import { Atom, atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { atomFamilyDeepEqual } from "../utils/jotai"

export const DataJSONSelectorFamily = atomFamily<
  string,
  Atom<Promise<DataJSON>>
>((coreName) =>
  atom(async (get) => {
    const path = `Cores/${coreName}/data.json`
    get(FileWatchAtomFamily(path))
    return readJSONFile<DataJSON>(path)
  })
)

export const coresListSelector = atom<Promise<string[]>>(async (get) => {
  get(FolderWatchAtomFamily("Cores"))
  return await invokeListFolders("Cores")
})

export const CoreInfoSelectorFamily = atomFamily<
  string,
  Atom<Promise<CoreInfoJSON>>
>((coreName: string) =>
  atom(async (get) => {
    const path = `Cores/${coreName}/core.json`
    get(FileWatchAtomFamily(path))
    return readJSONFile<CoreInfoJSON>(path)
  })
)

export const CoreMainPlatformIdSelectorFamily = atomFamily<
  string,
  Atom<Promise<string>>
>((coreName: string) =>
  atom(async (get) => {
    const { core } = await get(CoreInfoSelectorFamily(coreName))
    // Hopefully 0 is the one that exists
    return core.metadata.platform_ids[0]
  })
)

export const CoreAllPlatformIdsSelectorFamily = atomFamily<
  string,
  Atom<Promise<string[]>>
>((coreName: string) =>
  atom(async (get) => {
    const { core } = await get(CoreInfoSelectorFamily(coreName))
    return core.metadata.platform_ids
  })
)

export const CoreAuthorImageSelectorFamily = atomFamily<
  string,
  Atom<Promise<string>>
>((coreName: string) =>
  atom(async (get) => {
    const path = `Cores/${coreName}/icon.bin`
    get(FileWatchAtomFamily(path))
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
  })
)

export const AppVersionSelector = atom<Promise<string>>(
  async () => await getVersion()
)

export const WalkDirSelectorFamily = atomFamilyDeepEqual<
  { path: string; extensions?: string[]; offPocket?: boolean },
  Atom<Promise<string[]>>
>(({ path, extensions = [], offPocket = false }) =>
  atom(async (get) => {
    get(FolderWatchAtomFamily(path))
    const files = await invokeWalkDirListFiles(path, extensions, offPocket)
    return files
  })
)

export const ImageBinSrcSelectorFamily = atomFamilyDeepEqual<
  { path: string; width: number; height: number },
  Atom<Promise<string>>
>(({ path, width, height }) =>
  atom(async (get, { signal }) => {
    get(FileWatchAtomFamily(path))
    const exists = await invokeFileExists(path)
    signal.throwIfAborted()

    if (!exists) {
      // https://www.analogue.co/developer/docs/platform-metadata#platform-image
      // A platform _may_ have a graphic associated with it.

      const emptyBuffer = new Uint8Array(width * height * 2)
      return renderBinImage(emptyBuffer, width, height, true)
    }

    const response = await invokeReadBinaryFile(path)
    signal.throwIfAborted()

    return await new Promise<string>((resolve) => {
      // @ts-ignore not supported in safari
      if (window.requestIdleCallback) {
        requestIdleCallback(
          () => {
            signal.throwIfAborted()
            resolve(renderBinImage(response, width, height, true))
          },
          { timeout: 1000 }
        )
      } else {
        resolve(renderBinImage(response, width, height, true))
      }
    })
  })
)

export const CleanableFilesSelectorFamily = atomFamily<
  string,
  Atom<Promise<string[]>>
>((path) =>
  atom(async (get) => {
    get(FolderWatchAtomFamily(path))
    return await invokeFindCleanableFiles(path)
  })
)

export const homeDirSelector = atom<Promise<string>>(async () => path.homeDir())

export const mainWindowSelector = atom<Promise<Window>>(
  async () => await getCurrentWindow()
)
