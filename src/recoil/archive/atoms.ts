import { atom } from "recoil"

export const archiveBumpAtom = atom<number>({
  key: "archiveBumpAtom",
  default: 0,
})
