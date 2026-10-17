import React, { ReactElement, ReactNode, useState } from "react"

import * as RadixTooltip from "@radix-ui/react-tooltip"

import { usePortalContainer } from "../portalContainer"

import "./Tooltip.css"

export interface TooltipProps {
  label: ReactNode
  children: ReactElement
  side?: "top" | "right" | "bottom" | "left"
  /**
   * Turns the tooltip off without changing the tree, e.g. when the label is
   * already visible.
   */
  enabled?: boolean
  /** Keeps the tooltip open regardless of hover, e.g. to confirm an action. */
  forceOpen?: boolean
  /**
   * Closes as soon as the pointer leaves the trigger instead of letting it
   * move onto the tooltip. For triggers packed close together, e.g. chart
   * bars, so moving to the next one switches the tooltip.
   */
  disableHoverableContent?: boolean
}

const Tooltip = ({
  label,
  children,
  side = "top",
  enabled = true,
  forceOpen = false,
  disableHoverableContent,
}: TooltipProps) => {
  const [open, setOpen] = useState(false)
  const portalContainer = usePortalContainer()

  if (!enabled) return children

  return (
    <RadixTooltip.Root
      open={open || forceOpen}
      onOpenChange={setOpen}
      disableHoverableContent={disableHoverableContent}
    >
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal container={portalContainer}>
        <RadixTooltip.Content className="tooltip" side={side} sideOffset={8}>
          {label}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}

// Wraps the app once, so every Tooltip shares timing.
export const TooltipProvider = ({ children }: { children: ReactNode }) => (
  <RadixTooltip.Provider delayDuration={100} skipDelayDuration={300}>
    {children}
  </RadixTooltip.Provider>
)

export default Tooltip
