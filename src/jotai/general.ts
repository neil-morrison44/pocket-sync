import { getVersion } from "@tauri-apps/api/app"
import { atom } from "jotai"

export const pocketPathAtom = atom<null | string>(null)

export const appVersionAtom = atom<Promise<string>>(
  async () => await getVersion()
)
