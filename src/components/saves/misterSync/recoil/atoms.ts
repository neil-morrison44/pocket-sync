import { listen } from "@tauri-apps/api/event"
import { atom } from "recoil"

export const SavesInvalidationAtom = atom<number>({
  key: "SavesInvalidationAtom",
  default: 0,
  effects: [
    ({ setSelf }) => {
      listen("mister-save-sync-moved-save", () => {
        setSelf(Date.now())
      })
    },
  ],
})
