import { atom } from "recoil"

export const newsFeedUpdateAtom = atom<number>({
  key: "newsFeedUpdateAtom",
  default: 0,
})
