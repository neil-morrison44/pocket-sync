import { CoreInfoJSON, DataJSON } from "../types"
import { renderBinImage } from "../utils/renderBinImage"
import { getVersion } from "@tauri-apps/api/app"
import {
  invokeFileExists,
  invokeFindCleanableFiles,
  invokeFolderSize,
  invokeListFolders,
  invokeReadBinaryFile,
  invokeWalkDirListFiles,
} from "../utils/invokes"
import { AUTHOUR_IMAGE } from "../values"
import { readJSONFile } from "../utils/readJSONFile"
import { path } from "@tauri-apps/api"
import { fsWatchAtomFamily } from "./fileSystem/atoms"
import { Atom, atom } from "jotai"
import { atomWithRefresh } from "jotai/utils"
import { atomFamily } from "jotai-family"
import { atomFamilyDeepEqual, keepPreviousOrSuspend } from "../utils/jotai"
import { appCacheDir } from "@tauri-apps/api/path"
import prettyBytes from "pretty-bytes"
import { pocketPathAtom } from "./atoms"
import deepEqual from "fast-deep-equal/es6"

export const DataJSONSelectorFamily = atomFamily<
  string,
  Atom<Promise<DataJSON>>
>((coreName) =>
  atom(async (get) => {
    const path = `Cores/${coreName}/data.json`
    get(fsWatchAtomFamily(path))
    return readJSONFile<DataJSON>(path)
  })
)

/**
 * The installed cores' folder names. Writing any file in a core's folder
 * (e.g. its display modes) marks `Cores` as changed; the list stays the same
 * object unless cores were added or removed, so the pages built on it don't
 * suspend and jump back to the top.
 */
export const coresListSelector = keepPreviousOrSuspend(
  atom<Promise<string[]>>(async (get) => {
    get(fsWatchAtomFamily("Cores"))
    return await invokeListFolders("Cores")
  }),
  deepEqual
)

export const CoreInfoSelectorFamily = atomFamily<
  string,
  Atom<Promise<CoreInfoJSON>>
>((coreName: string) =>
  atom(async (get) => {
    const path = `Cores/${coreName}/core.json`
    get(fsWatchAtomFamily(path))
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
    get(fsWatchAtomFamily(path))
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
    get(fsWatchAtomFamily(path))
    const files = await invokeWalkDirListFiles(path, extensions, offPocket)
    return files
  })
)

export const ImageBinSrcSelectorFamily = atomFamilyDeepEqual<
  { path: string; width: number; height: number },
  Atom<Promise<string>>
>(({ path, width, height }) =>
  atom(async (get, { signal }) => {
    get(fsWatchAtomFamily(path))
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

/**
 * Files Clean Up Files would delete under `path`; after deleting, the
 * previous list stays until the new one is read (no loader flash).
 */
export const CleanableFilesSelectorFamily = atomFamily((path: string) =>
  keepPreviousOrSuspend(
    atom(async (get) => {
      get(fsWatchAtomFamily(path))
      return await invokeFindCleanableFiles(path)
    })
  )
)

export const homeDirSelector = atom<Promise<string>>(async () => path.homeDir())

export const cacheDirSizeSelector = atomWithRefresh<Promise<string>>(
  async () => {
    const folder = await appCacheDir()
    const size = await invokeFolderSize(folder)
    return prettyBytes(size)
  }
)

/**
 * The size of a folder on the SD card (`path` relative to the card, e.g.
 * `Assets/gb`), e.g. "1.2 GB"; for Games. Read again when its files change,
 * keeping the previous size meanwhile.
 */
export const FolderSizeSelectorFamily = atomFamily((path: string) =>
  keepPreviousOrSuspend(
    atom(async (get) => {
      get(fsWatchAtomFamily(path))
      const pocketPath = get(pocketPathAtom)
      const size = await invokeFolderSize(`${pocketPath}/${path}`)
      return prettyBytes(size)
    })
  )
)
