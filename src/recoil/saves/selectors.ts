import { selector, selectorFamily } from "recoil"
import { SaveZipFile } from "../../types"
import {
  invokeWalkDirListFiles,
  invokeListBackupSaves,
  invokeListSavesInZip,
  invokeListSavesOnPocket,
} from "../../utils/invokes"
import { fileSystemInvalidationAtom, saveFileInvalidationAtom } from "../atoms"

export const AllSavesSelector = selector<string[]>({
  key: "AllSavesSelector",
  get: async ({ get }) => {
    get(fileSystemInvalidationAtom)
    const saves = await invokeWalkDirListFiles(`Saves`, [".sav"])
    return saves.map((f) => f.replace(/^\//g, ""))
  },
})

export const BackupZipsSelectorFamily = selectorFamily<
  { files: SaveZipFile[]; exists: boolean },
  string
>({
  key: "BackupZipsSelectorFamily",
  get:
    (backupPath) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const backups = await invokeListBackupSaves(backupPath)
      return backups
    },
})

export const SaveZipFilesListSelectorFamily = selectorFamily<
  SaveZipFile[],
  string
>({
  key: "SaveZipFilesListSelectorFamily",
  get: (zipPath) => async () => {
    const backups = await invokeListSavesInZip(zipPath)
    return backups
  },
})

export const pocketSavesFilesListSelector = selector<SaveZipFile[]>({
  key: "pocketSavesFilesListSelector",
  get: async ({ get }) => {
    get(saveFileInvalidationAtom)
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
      console.log({ files })
      return files.map((zip) => ({
        zip,
        files: get(
          SaveZipFilesListSelectorFamily(`${backupPath}/${zip.filename}`)
        ),
      }))
    },
})
