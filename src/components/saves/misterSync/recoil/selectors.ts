import { emit, listen, once } from "@tauri-apps/api/event"
import { selectorFamily } from "recoil"
import { invokeFileMetadata } from "../../../../utils/invokes"
import { SavesInvalidationAtom } from "./atoms"

type MiSTerSaveInfo = {
  crc32?: number
  timestamp?: number
  path?: string
  pocket_save: {
    file: string
    platform: string
  }
}

export const MiSTerSaveInfoSelectorFamily = selectorFamily<
  MiSTerSaveInfo | null,
  { file: string | undefined; platform: string | undefined }
>({
  key: "MiSTerSaveInfoSelectorFamily",
  get:
    ({ platform, file }) =>
    async ({ get }) => {
      get(SavesInvalidationAtom)
      if (!platform || !file) return null

      emit("mister-save-sync-find-save", { file, platform })

      return new Promise<MiSTerSaveInfo>((resolve, reject) => {
        const listener = listen<MiSTerSaveInfo>(
          "mister-save-sync-found-save",
          ({ payload }) => {
            const { pocket_save } = payload
            if (
              pocket_save.platform === platform &&
              pocket_save.file === file
            ) {
              resolve(payload)
              listener.then((l) => l())
            }
          }
        )
      })
    },
})

export const FileMetadataSelectorFamily = selectorFamily<
  { timestamp: number; crc32: number },
  { filePath: string }
>({
  key: "FileMetadataSelectorFamily",
  get:
    ({ filePath }) =>
    async ({ get }) => {
      get(SavesInvalidationAtom)
      const info = await invokeFileMetadata(`Saves/${filePath}`)
      return info
    },
})
