import { ReactNode, startTransition } from "react"
import { useTranslation } from "react-i18next"
import Select from "../../ui/Select"

type ControlsSelectProps<T extends string> = {
  options: T[]
  selected: T
  children: ReactNode
  onChange: (value: T) => void
  i18nPrefix?: string
  /** Placeholder of a search field; adds one, for long lists. */
  searchPlaceholder?: string
  /** Marks a filter that's set (see `Select`'s `active`). */
  active?: boolean
}

export const ControlsSelect = <T extends string>({
  children,
  options,
  selected,
  onChange,
  i18nPrefix,
  searchPlaceholder,
  active,
}: ControlsSelectProps<T>) => {
  const { t } = useTranslation()

  return (
    <Select
      label={children}
      searchable={Boolean(searchPlaceholder)}
      searchPlaceholder={searchPlaceholder}
      active={active}
      value={selected}
      onChange={(value) => startTransition(() => onChange(value))}
      options={options.map((value) => ({
        value,
        label: i18nPrefix ? t(`${i18nPrefix}.${value}`) : value,
      }))}
    />
  )
}
