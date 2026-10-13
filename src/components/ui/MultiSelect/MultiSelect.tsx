import React, {
  ReactNode,
  startTransition,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  Combobox,
  ComboboxItem,
  ComboboxList,
  ComboboxProvider,
} from "@ariakit/react"
import * as RadixPopover from "@radix-ui/react-popover"
import clsx from "clsx"

import { useRovingFocus } from "../../../hooks/useRovingFocus"
import Button from "../Button"
import Icon from "../Icon"
import { usePortalContainer } from "../portalContainer"

import "./MultiSelect.css"

export interface MultiSelectOption<T extends string> {
  value: T
  label?: string
}

export interface MultiSelectProps<T extends string> {
  options: readonly MultiSelectOption<T>[]
  /** The checked values. */
  value: T[]
  onChange: (value: T[]) => void
  /** Content of the trigger button, e.g. "Filter by Author (2)". */
  children: ReactNode
  /** Adds a search field that filters the list (a combobox), for long lists. */
  searchable?: boolean
  /** Placeholder of the search field when `searchable`. */
  searchPlaceholder?: string
  /** Label of the button that checks every option. */
  selectAllLabel: string
  /** Label of the button that unchecks every option. */
  clearAllLabel: string
  className?: string
}

const ItemContent = ({
  label,
  checked,
}: {
  label: string
  checked: boolean
}) => (
  <>
    <span className="multi-select__check" aria-hidden>
      {checked && <Icon icon="check" />}
    </span>
    <span className="multi-select__label">{label}</span>
  </>
)

/**
 * A button that opens a checklist, e.g. for filters with several values.
 * Long lists get a search field; the footer checks or clears every option.
 */
function MultiSelect<T extends string>({
  options,
  value,
  onChange,
  children,
  searchable = false,
  searchPlaceholder,
  selectAllLabel,
  clearAllLabel,
  className,
}: MultiSelectProps<T>) {
  const portalContainer = usePortalContainer()
  const [search, setSearch] = useState("")
  const listRef = useRef<HTMLDivElement>(null)
  const rovingFocus = useRovingFocus(listRef, ".multi-select__item")

  const visibleOptions = useMemo(() => {
    const phrase = search.trim().toLowerCase()
    if (!phrase) return options
    return options.filter((option) =>
      (option.label ?? option.value).toLowerCase().includes(phrase)
    )
  }, [options, search])

  const toggle = (item: T) =>
    onChange(
      value.includes(item) ? value.filter((v) => v !== item) : [...value, item]
    )

  const list = searchable ? (
    <ComboboxProvider
      selectedValue={value}
      setSelectedValue={(selected: string[]) => onChange(selected as T[])}
      setValue={(phrase: string) => startTransition(() => setSearch(phrase))}
      resetValueOnHide
      includesBaseElement={false}
      focusLoop
    >
      <div className="multi-select__search">
        <Icon icon="search" />
        <Combobox
          autoSelect
          className="multi-select__search-field"
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
        />
      </div>
      <ComboboxList alwaysVisible className="multi-select__list">
        {visibleOptions.map((option) => (
          <ComboboxItem
            key={option.value}
            value={option.value}
            className="multi-select__item"
          >
            <ItemContent
              label={option.label ?? option.value}
              checked={value.includes(option.value)}
            />
          </ComboboxItem>
        ))}
      </ComboboxList>
    </ComboboxProvider>
  ) : (
    <div className="multi-select__list" ref={listRef} {...rovingFocus}>
      {options.map((option) => {
        const checked = value.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            role="checkbox"
            aria-checked={checked}
            className="multi-select__item"
            onClick={() => toggle(option.value)}
          >
            <ItemContent
              label={option.label ?? option.value}
              checked={checked}
            />
          </button>
        )
      })}
    </div>
  )

  return (
    <RadixPopover.Root onOpenChange={() => setSearch("")}>
      <RadixPopover.Trigger asChild>
        <Button icon="chevron-down" className={className}>
          {children}
        </Button>
      </RadixPopover.Trigger>
      <RadixPopover.Portal container={portalContainer}>
        <RadixPopover.Content
          className="multi-select__content"
          align="start"
          sideOffset={4}
          collisionPadding={16}
        >
          {list}
          <div className="multi-select__footer">
            <Button
              theme="tertiary"
              disabled={value.length === options.length}
              onClick={() => onChange(options.map((option) => option.value))}
            >
              {selectAllLabel}
            </Button>
            <Button
              theme="tertiary"
              disabled={value.length === 0}
              onClick={() => onChange([])}
            >
              {clearAllLabel}
            </Button>
          </div>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  )
}

export default MultiSelect
