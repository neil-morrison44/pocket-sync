import {
  ArchiveFileMetadata,
  FetchFileMetadataWithStatus,
  RootFile,
} from "../../types"
import { PocketSyncConfigSelector } from "../config/selectors"
import { archiveBumpAtom } from "./atoms"
import { invokeFilesMTime, invokeListRootFiles } from "../../utils/invokes"
import { fetch as tauriFecth } from "@tauri-apps/plugin-http"

import { pocketPathAtom } from "../atoms"
import { FolderWatchAtomFamily } from "../fileSystem/atoms"
import { WalkDirSelectorFamily } from "../selectors"
import { atomFamilyDeepEqual } from "../../utils/jotai"
import { Atom, atom } from "jotai"

export const ArchiveMetadataSelectorFamily = atomFamilyDeepEqual<
  { archiveName: string },
  Atom<Promise<null | ArchiveFileMetadata[]>>
>(({ archiveName }) =>
  atom(async (get, { signal }) => {
    get(archiveBumpAtom)
    const response = await tauriFecth(
      `https://archive.org/metadata/${archiveName}`,
      {
        method: "GET",
        signal,
      }
    )

    const data = (await response.json()) as {
      files?: ArchiveFileMetadata[]
    }

    if (!data.files) return null
    return data.files
  })
)

export const PathFileInfoSelectorFamily = atomFamilyDeepEqual<
  { path: string; offPocket?: boolean },
  Atom<Promise<FetchFileMetadataWithStatus[]>>
>(({ path, offPocket }) =>
  atom(async (get) => {
    get(FolderWatchAtomFamily(path))
    const pocketPath = get(pocketPathAtom)
    const fileList = await get(
      WalkDirSelectorFamily({ path, extensions: [], offPocket })
    )

    const mtimes = await invokeFilesMTime(
      fileList.map((filename) => {
        return offPocket
          ? `${path}/${filename}`
          : `${pocketPath}/${path}/${filename}`
      })
    )

    return mtimes.map(({ mtime }, index) => ({
      name: fileList[index],
      path,
      exists: mtime !== null,
      mtime: mtime || 0,
    }))
  })
)

export const archiveMetadataUrlSelector = atom<Promise<string | "">>(
  async (get) => {
    get(archiveBumpAtom)
    const config = await get(PocketSyncConfigSelector)
    if (!config.archive_url) return ""

    let url = config.archive_url.replace("download", "metadata")
    if (url.includes("updater.")) url = url + "/updater.php"

    return url
  }
)

export const ListSomeRootFilesSelectorFamily = atomFamilyDeepEqual<
  string[],
  Atom<Promise<RootFile[]>>
>((extensions) =>
  atom(async (get) => {
    get(FolderWatchAtomFamily("/"))
    const rootFileInfo = await invokeListRootFiles(extensions)
    return rootFileInfo
  })
)
