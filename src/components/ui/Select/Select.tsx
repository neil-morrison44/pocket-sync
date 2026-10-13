import React, { Fragment, ReactNode } from "react"

import * as RadixSelect from "@radix-ui/react-select"
import clsx from "clsx"

import Icon from "../Icon"

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

const renderItem = <T extends string>(option: SelectOption<T>) => (
  <RadixSelect.Item
    key={option.value}
    value={option.value}
    disabled={option.disabled}
    className="select__item"
  >
    <RadixSelect.ItemText>{option.label ?? option.value}</RadixSelect.ItemText>
    <RadixSelect.ItemIndicator className="select__item-indicator">
      <Icon icon="check" />
    </RadixSelect.ItemIndicator>
  </RadixSelect.Item>
)

function Select<T extends string>({
  options,
  value,
  onChange,
  label,
  name,
  id,
  disabled = false,
  theme = "control",
  className,
}: SelectProps<T>) {
  return (
    <RadixSelect.Root
      value={value}
      onValueChange={(newValue) => onChange(newValue as T)}
      name={name}
      disabled={disabled}
    >
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

      <RadixSelect.Portal>
        <RadixSelect.Content
          className="select__content"
          position="popper"
          sideOffset={4}
        >
          <RadixSelect.Viewport className="select__viewport">
            {groupOptions(options).map(
              ({ group, options: groupItems }, index) =>
                group === undefined ? (
                  <Fragment key={index}>{groupItems.map(renderItem)}</Fragment>
                ) : (
                  <RadixSelect.Group key={group} className="select__group">
                    <RadixSelect.Label className="select__group-label">
                      {group}
                    </RadixSelect.Label>
                    {groupItems.map(renderItem)}
                  </RadixSelect.Group>
                )
            )}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}

export default Select
