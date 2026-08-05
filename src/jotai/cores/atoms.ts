import { atom } from "jotai"
import { SortMode } from "../../types"

export const sortingOptionAtom = atom<SortMode>("name")

export const categoryFilterOptionAtom = atom<string>("All")
