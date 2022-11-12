import { atom } from "recoil"
import { invoke } from "@tauri-apps/api/tauri"

export const pocketPathAtom = atom<string | null>({
  key: "pocketPathAtom",
  default: null,
})
