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
}

const Tooltip = ({
  label,
  children,
  side = "top",
  enabled = true,
  forceOpen = false,
}: TooltipProps) => {
  const [open, setOpen] = useState(false)
  const portalContainer = usePortalContainer()

  if (!enabled) return children

  return (
    <RadixTooltip.Root open={open || forceOpen} onOpenChange={setOpen}>
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
