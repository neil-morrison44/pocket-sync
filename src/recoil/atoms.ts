import { atom } from "recoil"
import {
  syncToAppLocalDataEffect,
  syncToAppLocalDataEffectDefault,
} from "./effects"

export const pocketPathAtom = atom<string | null>({
  key: "pocketPathAtom",
  default: null,
})

export const fileSystemInvalidationAtom = atom<number>({
  key: "fileSystemInvalidationAtom",
  default: Date.now(),
})

export const PocketModelColourAtom = atom<"black" | "white">({
  key: "PocketModelColourAtom",
  default: "black",
})

export const configInvalidationAtom = atom<number>({
  key: "configInvalidationAtom",
  default: Date.now(),
})

export const saveFileInvalidationAtom = atom<number>({
  key: "saveFileInvalidationAtom",
  default: Date.now(),
})

export const reconnectWhenOpenedAtom = atom<{ enable: boolean; path: string }>({
  key: "reconnectWhenOpenedAtom",
  default: syncToAppLocalDataEffectDefault("reconnect_when_opened", {
    enable: false,
    path: "",
  }),
  effects: [syncToAppLocalDataEffect("reconnect_when_opened")],
})
