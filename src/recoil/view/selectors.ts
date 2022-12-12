import { DefaultValue, selector } from "recoil"
import { currentViewAtom } from "./atoms"

export const selectedSubviewSelector = selector<string | null>({
  key: "selectedSubviewSelector",
  get: ({ get }) => {
    const currentView = get(currentViewAtom)
    return currentView.selected
  },
  set: ({ set, get }, newValue) => {
    const currentView = get(currentViewAtom)

    if (newValue instanceof DefaultValue) {
      set(currentViewAtom, { ...currentView, selected: null })
    } else if (
      currentView.view === "Platforms" ||
      currentView.view === "Screenshots" ||
      currentView.view === "Cores"
    ) {
      // @ts-ignore
      set(currentViewAtom, { ...currentView, selected: newValue })
    }
  },
})
