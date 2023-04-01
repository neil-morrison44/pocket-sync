import { emit, listen, once } from "@tauri-apps/api/event"
import { selectorFamily } from "recoil"

type MiSTerSaveInfo = {
  equal: boolean
  timestamp: number
  path: string
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
        once<MiSTerSaveInfo>("mister-save-sync-found-save", ({ payload }) => {
          console.log({ payload })
          resolve(payload)
        })
      })
    },
})
