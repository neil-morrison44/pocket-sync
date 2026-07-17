import { currentViewAtom } from "./atoms"
import { atom } from "jotai"

export const selectedSubviewSelector = atom(
  (get) => get(currentViewAtom).selected,
  (get, set, newValue?: string | null) => {
    const currentView = get(currentViewAtom)
    if (!newValue) {
      set(currentViewAtom, { ...currentView, selected: null })
    } else if (
      currentView.view === "Platforms" ||
      currentView.view === "Screenshots" ||
      currentView.view === "Cores"
    ) {
      // @ts-expect-error
      set(currentViewAtom, { ...currentView, selected: newValue ?? null })
    }
  }
)
