import { atom } from "jotai"

export const VIEWS_LIST = [
  "Pocket Sync",
  "Games",
  "Cores",
  "Screenshots",
  "Saves",
  "Save States",
  "Platforms",
  "Palettes",
  "Firmware",
  "Fetch",
  "Settings",
] as const

type ALL_VIEWS = (typeof VIEWS_LIST)[number]
type VIEWS_WITH_SELECTION = "Cores" | "Screenshots" | "Platforms"

type ViewAndSubview =
  | {
      view: Omit<ALL_VIEWS, VIEWS_WITH_SELECTION>
      selected: null
    }
  | {
      view: VIEWS_WITH_SELECTION
      selected: string | null
    }

export const currentViewAtom = atom<ViewAndSubview>({
  view: "Pocket Sync",
  selected: null,
})
