import React, { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ControlsPopoverButton } from "../controls/inputs/popoverButton"
import { Controls } from "../controls"
import MultiSelect from "../ui/MultiSelect"

/** Long lists (authors, categories) get a search field. */
const SEARCH_THRESHOLD = 8

type HiddenFilterSelectProps<T extends string> = {
  items: readonly T[]
  /** Unchecked items; the list filters them out. */
  hiddenItems: T[]
  setHiddenItems: (hiddenItems: T[]) => void
  getItemLabel?: (item: T) => string
  children: ReactNode
}

// The filters store what is hidden; the checklist shows what is shown
const HiddenFilterSelect = <T extends string>({
  items,
  hiddenItems,
  setHiddenItems,
  getItemLabel = (item) => item,
  children,
}: HiddenFilterSelectProps<T>) => {
  const { t } = useTranslation("update")

  return (
    <MultiSelect
      options={items.map((item) => ({
        value: item,
        label: getItemLabel(item),
      }))}
      value={items.filter((item) => !hiddenItems.includes(item))}
      onChange={(shown) =>
        setHiddenItems(items.filter((item) => !shown.includes(item)))
      }
      searchable={items.length > SEARCH_THRESHOLD}
      searchPlaceholder={t("controls.search_filter")}
      selectAllLabel={t("controls.select_all")}
      clearAllLabel={t("controls.clear_all")}
    >
      {children}
    </MultiSelect>
  )
}

type AuthorFilterControlProps = {
  authorList: string[]
  hiddenAuthorList: string[]
  setHiddenAuthorList: React.Dispatch<React.SetStateAction<string[]>>
}

const AuthorFilterControl = ({
  authorList,
  hiddenAuthorList,
  setHiddenAuthorList,
}: AuthorFilterControlProps) => {
  const { t } = useTranslation("update")

  return (
    <HiddenFilterSelect
      items={authorList}
      hiddenItems={hiddenAuthorList}
      setHiddenItems={setHiddenAuthorList}
    >
      {t("controls.filter_by_author", { count: hiddenAuthorList.length })}
    </HiddenFilterSelect>
  )
}

type AiNessFilterControlProps = {
  aiNess: number
  setAiNess: (value: number) => void
}

const AiNessFilterControl = ({
  aiNess,
  setAiNess,
}: AiNessFilterControlProps) => {
  const { t } = useTranslation("update")

  return (
    <ControlsPopoverButton
      renderPopoverContent={() => (
        <div className="update__filter-slider">
          <div>{t("controls.ai_ness.title")}</div>
          <div className="update__filter-slider-input">
            <input
              type="range"
              min={0}
              max={100}
              value={aiNess * 100}
              onChange={({ target }) => {
                const value = parseInt(target.value)
                setAiNess(value / 100)
              }}
            />
            <div>{t("controls.ai_ness.value", { score: aiNess })}</div>
          </div>
        </div>
      )}
    >
      {t("controls.filter_by_ai_ness", { value: aiNess })}
    </ControlsPopoverButton>
  )
}

type CategoryFilterControlProps = {
  categoryList: string[]
  hiddenCategoryList: string[]
  setHiddenCategoryList: React.Dispatch<React.SetStateAction<string[]>>
}

const CategoryFilterControl = ({
  categoryList,
  hiddenCategoryList,
  setHiddenCategoryList,
}: CategoryFilterControlProps) => {
  const { t } = useTranslation("update")

  return (
    <HiddenFilterSelect
      items={categoryList}
      hiddenItems={hiddenCategoryList}
      setHiddenItems={setHiddenCategoryList}
    >
      {t("controls.filter_by_category", {
        count: hiddenCategoryList.length,
      })}
    </HiddenFilterSelect>
  )
}

export type OtherFilterType =
  | "analogizer"
  | "requires_jotego_license"
  | "requires_coc_license"
  | "update"
  | "install"

const OTHER_FILTER_OPTIONS: readonly OtherFilterType[] = [
  "analogizer",
  "requires_jotego_license",
  "requires_coc_license",
  "update",
  "install",
]

type OtherFiltersControlProps = {
  otherFilters: OtherFilterType[]
  setOtherFilters: React.Dispatch<React.SetStateAction<OtherFilterType[]>>
}

const OtherFiltersControl = ({
  otherFilters,
  setOtherFilters,
}: OtherFiltersControlProps) => {
  const { t } = useTranslation("update")

  return (
    <HiddenFilterSelect
      items={OTHER_FILTER_OPTIONS}
      hiddenItems={otherFilters}
      setHiddenItems={setOtherFilters}
      getItemLabel={(item) => t(`controls.other_filters.${item}`)}
    >
      {t("controls.other_filters.title", { count: otherFilters.length })}
    </HiddenFilterSelect>
  )
}

type UpdateControlsProps = {
  authorList: string[]
  hiddenAuthorList: string[]
  setHiddenAuthorList: React.Dispatch<React.SetStateAction<string[]>>
  categoryList: string[]
  hiddenCategoryList: string[]
  setHiddenCategoryList: React.Dispatch<React.SetStateAction<string[]>>
  aiNess: number
  setAiNess: (val: number) => void
  otherFilters: OtherFilterType[]
  setOtherFilters: React.Dispatch<React.SetStateAction<OtherFilterType[]>>
}

export const UpdateControls = ({
  authorList,
  hiddenAuthorList,
  setHiddenAuthorList,
  categoryList,
  hiddenCategoryList,
  setHiddenCategoryList,
  aiNess,
  setAiNess,
  otherFilters,
  setOtherFilters,
}: UpdateControlsProps) => {
  return (
    <Controls>
      <AuthorFilterControl
        authorList={authorList}
        hiddenAuthorList={hiddenAuthorList}
        setHiddenAuthorList={setHiddenAuthorList}
      />
      <AiNessFilterControl aiNess={aiNess} setAiNess={setAiNess} />
      <CategoryFilterControl
        categoryList={categoryList}
        hiddenCategoryList={hiddenCategoryList}
        setHiddenCategoryList={setHiddenCategoryList}
      />
      <OtherFiltersControl
        otherFilters={otherFilters}
        setOtherFilters={setOtherFilters}
      />
    </Controls>
  )
}
