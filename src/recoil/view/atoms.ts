import { atom } from "recoil"

export const VIEWS_LIST = [
  "Pocket Sync",
  "Games",
  "Cores",
  "Screenshots",
  "Saves",
  "Save States",
  "Platforms",
  "Settings",
] as const

export type ViewAndSubview =
  | {
      view:
        | "Pocket Sync"
        | "Games"
        | "Saves"
        | "Save States"
        | "Platforms"
        | "Settings"
      selected: null
    }
  | {
      view: "Cores" | "Screenshots" | "Platforms"
      selected: string | null
    }

export const currentViewAtom = atom<ViewAndSubview>({
  key: "currentViewAtom",
  default: {
    view: "Pocket Sync",
    selected: null,
  },
})
