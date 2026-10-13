import React, {
  Fragment,
  ReactNode,
  startTransition,
  useMemo,
  useState,
} from "react"

import {
  Combobox,
  ComboboxItem,
  ComboboxList,
  ComboboxProvider,
} from "@ariakit/react"
import * as RadixSelect from "@radix-ui/react-select"
import clsx from "clsx"

import Icon from "../Icon"
import { usePortalContainer } from "../portalContainer"

import "./Select.css"

export type SelectTheme = "control"

export interface SelectOption<T extends string> {
  value: T
  label?: string
  disabled?: boolean
  /** Options with the same group are listed together under that heading. */
  group?: string
}

export interface SelectProps<T extends string> {
  options: SelectOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Shown before the selected value, e.g. "Category". */
  label?: ReactNode
  name?: string
  /** Lets a separate `<label htmlFor>` name the select. */
  id?: string
  disabled?: boolean
  /** Adds a search field to the open list (a combobox), for long lists. */
  searchable?: boolean
  /** Placeholder of the search field when `searchable`. */
  searchPlaceholder?: string
  theme?: SelectTheme
  className?: string
}

// Radix reserves "" for clearing the selection, so empty values are skipped.
// Groups keep the order in which they first appear.
function groupOptions<T extends string>(options: SelectOption<T>[]) {
  const groups: { group?: string; options: SelectOption<T>[] }[] = []
  for (const option of options) {
    if (option.value === "") continue
    const last = groups[groups.length - 1]
    if (last && last.group === option.group) last.options.push(option)
    else groups.push({ group: option.group, options: [option] })
  }
  return groups
}

const renderItem =
  (searchable: boolean) =>
  <T extends string>(option: SelectOption<T>) => {
    const content = (
      <>
        <RadixSelect.ItemText>
          {option.label ?? option.value}
        </RadixSelect.ItemText>
        <RadixSelect.ItemIndicator className="select__item-indicator">
          <Icon icon="check" />
        </RadixSelect.ItemIndicator>
      </>
    )

    return (
      <RadixSelect.Item
        key={option.value}
        value={option.value}
        disabled={option.disabled}
        className="select__item"
        asChild={searchable}
      >
        {searchable ? <ComboboxItem>{content}</ComboboxItem> : content}
      </RadixSelect.Item>
    )
  }

function Select<T extends string>({
  options,
  value,
  onChange,
  label,
  name,
  id,
  disabled = false,
  searchable = false,
  searchPlaceholder,
  theme = "control",
  className,
}: SelectProps<T>) {
  const portalContainer = usePortalContainer()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const visibleOptions = useMemo(() => {
    const phrase = search.trim().toLowerCase()
    if (!searchable || !phrase) return options
    // Radix Select needs the selected item rendered, so it always stays
    return options.filter(
      (option) =>
        option.value === value ||
        (option.label ?? option.value).toLowerCase().includes(phrase) ||
        option.value.toLowerCase().includes(phrase)
    )
  }, [options, search, searchable, value])

  const items = groupOptions(visibleOptions).map(
    ({ group, options: groupItems }, index) =>
      group === undefined ? (
        <Fragment key={index}>
          {groupItems.map(renderItem(searchable))}
        </Fragment>
      ) : (
        <RadixSelect.Group key={group} className="select__group">
          <RadixSelect.Label className="select__group-label">
            {group}
          </RadixSelect.Label>
          {groupItems.map(renderItem(searchable))}
        </RadixSelect.Group>
      )
  )

  const trigger = (
    <RadixSelect.Trigger
      id={id}
      className={clsx(
        "select",
        `select--theme-${theme}`,
        disabled && "select--is-disabled",
        className
      )}
    >
      {label && <span className="select__label">{label}</span>}
      <span className="select__value">
        <RadixSelect.Value />
      </span>
      <RadixSelect.Icon className="select__chevron">
        <Icon icon="chevrons-vertical" />
      </RadixSelect.Icon>
    </RadixSelect.Trigger>
  )

  const content = (
    <RadixSelect.Portal container={portalContainer}>
      <RadixSelect.Content
        className="select__content"
        position="popper"
        sideOffset={4}
      >
        {searchable && (
          <div className="select__search">
            <Icon icon="search" />
            <Combobox
              autoSelect
              className="select__search-field"
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              // Ariakit blurs virtually focused items, which Radix Select
              // would read as focus leaving the list and close it
              onBlurCapture={(event: React.FocusEvent) => {
                event.preventDefault()
                event.stopPropagation()
              }}
            />
          </div>
        )}
        <RadixSelect.Viewport className="select__viewport">
          {searchable ? <ComboboxList>{items}</ComboboxList> : items}
        </RadixSelect.Viewport>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  )

  return (
    <RadixSelect.Root
      value={value}
      onValueChange={(newValue) => onChange(newValue as T)}
      name={name}
      disabled={disabled}
      open={open}
      onOpenChange={(isOpen) => {
        setSearch("")
        setOpen(isOpen)
      }}
    >
      {searchable ? (
        <ComboboxProvider
          open={open}
          setOpen={setOpen}
          resetValueOnHide
          includesBaseElement={false}
          setValue={(phrase: string) =>
            startTransition(() => setSearch(phrase))
          }
        >
          {trigger}
          {content}
        </ComboboxProvider>
      ) : (
        <>
          {trigger}
          {content}
        </>
      )}
    </RadixSelect.Root>
  )
}

export default Select
