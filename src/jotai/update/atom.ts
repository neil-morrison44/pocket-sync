import { OtherFilterType } from "../../components/update/controls"
import { atomWithAppLocalStorage } from "../../utils/jotai"

export type UpdateFilterOptions = {
  authorFilters: string[]
  aiNessFilter: number
  categoryFilters: string[]
  otherFilters: OtherFilterType[]
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
