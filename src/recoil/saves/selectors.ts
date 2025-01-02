import { selector, selectorFamily } from "recoil"
import { SaveZipFile } from "../../types"
import {
  invokeListBackupSaves,
  invokeListSavesInZip,
  invokeListSavesOnPocket,
} from "../../utils/invokes"
import { FolderWatchAtomFamily } from "../fileSystem/atoms"
import { WalkDirSelectorFamily } from "../selectors"

export const AllSavesSelector = selector<string[]>({
  key: "AllSavesSelector",
  get: async ({ get }) => {
    const saves = get(
      WalkDirSelectorFamily({ path: "Saves", extensions: [".sav"] })
    )
    return saves.map((f) => f.replace(/^\//g, ""))
  },
})

export const BackupZipsSelectorFamily = selectorFamily<
  { files: SaveZipFile[]; exists: boolean },
  string
>({
  key: "BackupZipsSelectorFamily",
  get: (backupPath) => async () => {
    const backups = await invokeListBackupSaves(backupPath)
    return backups
  },
})

const SaveZipFilesListSelectorFamily = selectorFamily<SaveZipFile[], string>({
  key: "SaveZipFilesListSelectorFamily",
  get: (zipPath) => async () => {
    const backups = await invokeListSavesInZip(zipPath)
    return backups
  },
})

export const pocketSavesFilesListSelector = selector<SaveZipFile[]>({
  key: "pocketSavesFilesListSelector",
  get: async ({ get }) => {
    get(FolderWatchAtomFamily("Saves"))
    const savesList = await invokeListSavesOnPocket()
    return savesList
  },
})

export const AllBackupZipsFilesSelectorFamily = selectorFamily<
  { zip: SaveZipFile; files: SaveZipFile[] }[],
  string
>({
  key: "AllBackupZipsFilesSelectorFamily",
  get:
    (backupPath) =>
    async ({ get }) => {
      const { files } = get(BackupZipsSelectorFamily(backupPath))
      return files.map((zip) => ({
        zip,
        files: get(
          SaveZipFilesListSelectorFamily(`${backupPath}/${zip.filename}`)
        ),
      }))
    },
})
