import { ReactNode } from "react"

import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu"
import clsx from "clsx"

import Button, { ButtonTheme } from "../Button"
import Icon from "../Icon"
import { usePortalContainer } from "../portalContainer"

import "./Menu.css"

export interface MenuItem {
  /** Passed to `onSelect` when the item is chosen. */
  value: string
  label: ReactNode
  /** Shown after the label, in a softer colour, e.g. a date. */
  detail?: ReactNode
}

export interface MenuProps {
  /** The trigger button's text; it stays the same whatever is chosen. */
  label: ReactNode
  items: MenuItem[]
  onSelect: (value: string) => void
  theme?: ButtonTheme
  align?: "start" | "center" | "end"
  className?: string
}

/**
 * A button that opens a list of actions, e.g. "Jump to" a version. Unlike
 * `Select` it holds no value: choosing an item runs `onSelect` and the
 * button keeps its label.
 */
const Menu = ({
  label,
  items,
  onSelect,
  theme = "secondary",
  align = "end",
  className,
}: MenuProps) => (
  <RadixDropdownMenu.Root>
    <RadixDropdownMenu.Trigger asChild>
      <Button theme={theme} className={clsx("menu__trigger", className)}>
        {label}
        <Icon icon="chevron-down" />
      </Button>
    </RadixDropdownMenu.Trigger>
    <RadixDropdownMenu.Portal container={usePortalContainer()}>
      <RadixDropdownMenu.Content
        className="menu__content"
        align={align}
        sideOffset={4}
        collisionPadding={16}
      >
        {items.map((item) => (
          <RadixDropdownMenu.Item
            key={item.value}
            className="menu__item"
            onSelect={() => onSelect(item.value)}
          >
            <span>{item.label}</span>
            {item.detail && (
              <span className="menu__item-detail">{item.detail}</span>
            )}
          </RadixDropdownMenu.Item>
        ))}
      </RadixDropdownMenu.Content>
    </RadixDropdownMenu.Portal>
  </RadixDropdownMenu.Root>
)

export default Menu
