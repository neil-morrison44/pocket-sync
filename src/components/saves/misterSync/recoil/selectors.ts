import { emit, listen, once } from "@tauri-apps/api/event"
import { selectorFamily } from "recoil"
import { invokeFileMetadata } from "../../../../utils/invokes"

type MiSTerSaveInfo = {
  equal: boolean
  timestamp: number
  path: string
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
    async () => {
      if (!platform || !file) return null

      emit("mister-save-sync-find-save", { file, platform })

      return new Promise<MiSTerSaveInfo>((resolve, reject) => {
        const listener = listen<MiSTerSaveInfo>(
          "mister-save-sync-found-save",
          ({ payload }) => {
            console.log({ payload })
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
    async () => {
      const info = await invokeFileMetadata(`Saves/${filePath}`)
      return info
    },
})
