import { atom } from "recoil"
import { SortMode } from "../../types"

export const sortingOptionAtom = atom<SortMode>({
  key: "sortingOptionAtom",
  default: "name",
})

export const categoryFilterOptionAtom = atom<string>({
  key: "categoryFilterOptionAtom",
  default: "All",
})
