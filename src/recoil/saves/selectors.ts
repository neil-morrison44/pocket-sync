import { atomFamily } from "jotai/utils"
import { SaveZipFile } from "../../types"
import {
  invokeListBackupSaves,
  invokeListSavesInZip,
  invokeListSavesOnPocket,
} from "../../utils/invokes"
import { FolderWatchAtomFamily } from "../fileSystem/atoms"
import { WalkDirSelectorFamily } from "../selectors"
import { Atom, atom } from "jotai"

export const AllSavesSelector = atom<Promise<string[]>>(async (get) => {
  const saves = await get(
    WalkDirSelectorFamily({ path: "Saves", extensions: [".sav"] })
  )
  return saves.map((f) => f.replace(/^\//g, ""))
})

export const BackupZipsSelectorFamily = atomFamily<
  string,
  Atom<Promise<{ files: SaveZipFile[]; exists: boolean }>>
>((backupPath) =>
  atom(async () => {
    const backups = await invokeListBackupSaves(backupPath)
    return backups
  })
)

const SaveZipFilesListSelectorFamily = atomFamily<
  string,
  Atom<Promise<SaveZipFile[]>>
>((zipPath) =>
  atom(async () => {
    const backups = await invokeListSavesInZip(zipPath)
    return backups
  })
)

export const pocketSavesFilesListSelector = atom<Promise<SaveZipFile[]>>(
  async (get) => {
    get(FolderWatchAtomFamily("Saves"))
    const savesList = await invokeListSavesOnPocket()
    return savesList
  }
)

export const AllBackupZipsFilesSelectorFamily = atomFamily<
  string,
  Atom<Promise<{ zip: SaveZipFile; files: SaveZipFile[] }[]>>
>((backupPath) =>
  atom(async (get) => {
    const { files } = await get(BackupZipsSelectorFamily(backupPath))
    return Promise.all(
      files.map(async (zip) => ({
        zip,
        files: await get(
          SaveZipFilesListSelectorFamily(`${backupPath}/${zip.filename}`)
        ),
      }))
    )
  })
)
