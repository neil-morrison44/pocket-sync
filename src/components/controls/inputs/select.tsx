import { ReactNode, startTransition } from "react"
import { useTranslation } from "react-i18next"

type ControlsSelectProps<T extends string> = {
  options: T[]
  selected: T
  children: ReactNode
  onChange: (value: T) => void
  i18nPrefix?: string
}

export const ControlsSelect = <T extends string>({
  children,
  options,
  selected,
  onChange,
  i18nPrefix,
}: ControlsSelectProps<T>) => {
  const { t } = useTranslation()

  return (
    <label className="controls__item controls__select">
      {children}
      <select
        value={selected}
        onChange={({ target }) =>
          startTransition(() => onChange(target.value as T))
        }
      >
        {options.map((v) => (
          <option value={v} key={v}>
            {i18nPrefix ? t(`${i18nPrefix}.${v}`) : v}
          </option>
        ))}
      </select>
    </label>
  )
}
