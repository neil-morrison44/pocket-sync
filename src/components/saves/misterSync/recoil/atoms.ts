import { listen } from "@tauri-apps/api/event"
import { atom } from "recoil"
import { syncToAppLocalDataEffect } from "../../../../recoil/effects"

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

export const MiSTerCredsAtom = atom<{
  host: string
  user: string
  password: string
}>({
  key: "MiSTerCredsAtom",
  default: {
    host: "",
    user: "root",
    password: "1",
  },
  effects: [syncToAppLocalDataEffect("mister_creds")],
})
