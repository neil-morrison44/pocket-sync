import React from "react"
import { useTranslation } from "react-i18next"
import { ControlsPopoverButton } from "../controls/inputs/popoverButton"
import { Controls } from "../controls"

type CheckboxFilterListProps<T extends string> = {
  items: readonly T[]
  hiddenItems: T[]
  onToggle: (item: T, isChecked: boolean) => void
  onToggleAll: (isChecked: boolean) => void
  getItemLabel?: (item: T) => string
}

const CheckboxFilterList = <T extends string>({
  items,
  hiddenItems,
  onToggle,
  onToggleAll,
  getItemLabel = (item) => item,
}: CheckboxFilterListProps<T>) => {
  return (
    <div className="update__filter-list">
      <label className="update__filter-item update__filter-item--all">
        <input
          type="checkbox"
          checked={hiddenItems.length == 0}
          onChange={(e) => onToggleAll(e.target.checked)}
        />
      </label>
      {items.map((item) => (
        <label key={item} className="update__filter-item">
          {getItemLabel(item)}
          <input
            type="checkbox"
            checked={!hiddenItems.includes(item)}
            onChange={(e) => onToggle(item, e.target.checked)}
          />
        </label>
      ))}
    </div>
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

  const handleToggle = (author: string, isChecked: boolean) => {
    setHiddenAuthorList((prev) =>
      isChecked ? prev.filter((a) => a !== author) : [...prev, author]
    )
  }

  const handleToggleAll = (isChecked: boolean) => {
    setHiddenAuthorList(() => (isChecked ? [] : [...authorList]))
  }

  return (
    <ControlsPopoverButton
      renderPopoverContent={() => (
        <CheckboxFilterList
          items={authorList}
          hiddenItems={hiddenAuthorList}
          onToggle={handleToggle}
          onToggleAll={handleToggleAll}
        />
      )}
    >
      {t("controls.filter_by_author", { count: hiddenAuthorList.length })}
    </ControlsPopoverButton>
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

  const handleToggle = (category: string, isChecked: boolean) => {
    setHiddenCategoryList((prev) =>
      isChecked ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  const handleToggleAll = (isChecked: boolean) => {
    setHiddenCategoryList(() => (isChecked ? [] : [...categoryList]))
  }

  return (
    <ControlsPopoverButton
      renderPopoverContent={() => (
        <CheckboxFilterList
          items={categoryList}
          hiddenItems={hiddenCategoryList}
          onToggle={handleToggle}
          onToggleAll={handleToggleAll}
        />
      )}
    >
      {t("controls.filter_by_category", {
        count: hiddenCategoryList.length,
      })}
    </ControlsPopoverButton>
  )
}

type OtherFilterType =
  "analogizer" | "requires_jotego_license" | "requires_coc_license"

const OTHER_FILTER_OPTIONS: readonly OtherFilterType[] = [
  "analogizer",
  "requires_jotego_license",
  "requires_coc_license",
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

  const handleToggle = (item: OtherFilterType, isChecked: boolean) => {
    setOtherFilters((prev) =>
      isChecked ? prev.filter((f) => f !== item) : [...prev, item]
    )
  }

  const handleToggleAll = (isChecked: boolean) => {
    setOtherFilters(() => (isChecked ? [] : [...OTHER_FILTER_OPTIONS]))
  }

  return (
    <ControlsPopoverButton
      renderPopoverContent={() => (
        <CheckboxFilterList
          items={OTHER_FILTER_OPTIONS}
          hiddenItems={otherFilters}
          onToggle={handleToggle}
          onToggleAll={handleToggleAll}
          getItemLabel={(item) => t(`controls.other_filters.${item}`)}
        />
      )}
    >
      {t("controls.other_filters.title", { count: otherFilters.length })}
    </ControlsPopoverButton>
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
