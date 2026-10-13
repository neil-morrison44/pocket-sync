import React, { ReactElement, ReactNode } from "react"

import * as RadixPopover from "@radix-ui/react-popover"
import clsx from "clsx"

import { usePortalContainer } from "../portalContainer"

import "./Popover.css"

export interface PopoverProps {
  /** The element that opens the popover, e.g. an IconButton. */
  trigger: ReactElement
  /** Heading inside the panel. */
  title?: ReactNode
  children: ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  className?: string
}

/** A small panel anchored to its trigger, for quick settings. */
const Popover = ({
  trigger,
  title,
  children,
  side = "bottom",
  align = "end",
  className,
}: PopoverProps) => (
  <RadixPopover.Root>
    <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
    <RadixPopover.Portal container={usePortalContainer()}>
      <RadixPopover.Content
        className={clsx("popover", className)}
        side={side}
        align={align}
        sideOffset={8}
        collisionPadding={16}
      >
        {title && <div className="popover__title">{title}</div>}
        {children}
      </RadixPopover.Content>
    </RadixPopover.Portal>
  </RadixPopover.Root>
)

export default Popover
