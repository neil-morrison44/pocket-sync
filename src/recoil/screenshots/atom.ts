import { atom } from "recoil"

export const imageModeAtom = atom<"raw" | "upscaled">({
  key: "imageModeAtom",
  default: "upscaled",
})
