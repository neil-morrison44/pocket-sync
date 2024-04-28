import { emit, listen } from "@tauri-apps/api/event"
import { selector, selectorFamily } from "recoil"
import {
  invokeFileMetadata,
  invokeListFolders,
} from "../../../../utils/invokes"
import { SavesInvalidationAtom, saveMappingAtom } from "./atoms"

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
  { file: string | undefined; platforms: string[] }
>({
  key: "MiSTerSaveInfoSelectorFamily",
  get:
    ({ platforms, file }) =>
    async ({ get }) => {
      get(SavesInvalidationAtom)
      if (!platforms || !file) return null

      emit("mister-save-sync-find-save", { file, platforms })

      return new Promise<MiSTerSaveInfo>((resolve, _reject) => {
        const unlistener = listen<MiSTerSaveInfo>(
          "mister-save-sync-found-save",
          ({ payload }) => {
            const { pocket_save } = payload
            if (pocket_save.file === file) {
              resolve(payload)
              unlistener.then((l) => l())
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

export const platformsListMiSTerSelector = selector<string[]>({
  key: "platformsListMiSTerSelector",
  get: async () => {
    emit("mister-save-sync-list-platforms")

    return new Promise<string[]>((resolve, _reject) => {
      const unlisten = listen<string[]>(
        "mister-save-sync-platform-list",
        ({ payload }) => {
          const sorted = [...payload].sort((a, b) => a.localeCompare(b))
          resolve(sorted)
          unlisten.then((l) => l())
        }
      )
    })
  },
})

export const platformListPocketSelector = selector<string[]>({
  key: "platformListPocketSelector",
  get: async () => {
    const platforms = await invokeListFolders("Saves")
    const sorted = [...platforms].sort((a, b) => a.localeCompare(b))
    return sorted
  },
})

export const MiSTerPlatformsForPocketPlatformSelectorFamily = selectorFamily<
  string[],
  string | undefined
>({
  key: "MiSTerPlatformsForPocketPlatformSelectorFamily",
  get:
    (pocketPlatform) =>
    ({ get }) => {
      if (!pocketPlatform) return []
      const mapping = get(saveMappingAtom)
      return mapping
        .filter((m) => m.pocket === pocketPlatform)
        .map((m) => m.mister)
    },
})
