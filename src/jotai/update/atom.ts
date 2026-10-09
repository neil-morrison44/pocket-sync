import { atomWithAppLocalStorage } from "../../utils/jotai"

export type UpdateFilterOptions = {
  authorFilters: string[]
  aiNessFilter: number
  categoryFilters: string[]
  otherFilters: (
    "analogizer" | "requires_coc_license" | "requires_jotego_license"
  )[]
}

export const updateFilterDefaultsAtom =
  atomWithAppLocalStorage<UpdateFilterOptions>("update_filter_options", {
    authorFilters: [],
    aiNessFilter: 1,
    categoryFilters: [],
    otherFilters: [
      "analogizer",
      "requires_coc_license",
      "requires_jotego_license",
    ],
  })
