import { emit, listen } from "@tauri-apps/api/event"
import {
  invokeFileMetadata,
  invokeListFolders,
} from "../../../../utils/invokes"
import { SavesInvalidationAtom, saveMappingAtom } from "./atoms"
import { atomFamily } from "jotai/utils"
import { atom, Atom } from "jotai"
import { atomFamilyDeepEqual } from "../../../../utils/jotai"

type MiSTerSaveInfo = {
  crc32?: number
  timestamp?: number
  path?: string
  pocket_save: {
    file: string
    platform: string
  }
}

export const MiSTerSaveInfoSelectorFamily = atomFamilyDeepEqual<
  { file: string | undefined; platforms: string[] },
  Atom<Promise<MiSTerSaveInfo | null>>
>(({ platforms, file }) =>
  atom(async (get) => {
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
  })
)

export const FileMetadataSelectorFamily = atomFamilyDeepEqual<
  { filePath: string },
  Atom<Promise<{ timestamp: number; crc32: number }>>
>(({ filePath }) =>
  atom(async (get) => {
    get(SavesInvalidationAtom)
    const info = await invokeFileMetadata(`Saves/${filePath}`)
    return info
  })
)

export const platformsListMiSTerSelector = atom<Promise<string[]>>(async () => {
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
})

export const platformListPocketSelector = atom<Promise<string[]>>(async () => {
  const platforms = await invokeListFolders("Saves")
  const sorted = [...platforms].sort((a, b) => a.localeCompare(b))
  return sorted
})

export const MiSTerPlatformsForPocketPlatformSelectorFamily = atomFamily<
  string | undefined,
  Atom<Promise<string[]>>
>((pocketPlatform) =>
  atom(async (get) => {
    if (!pocketPlatform) return []
    const mapping = await get(saveMappingAtom)
    return mapping
      .filter((m) => m.pocket === pocketPlatform)
      .map((m) => m.mister)
  })
)
