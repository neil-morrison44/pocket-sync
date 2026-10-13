import { createContext, useContext } from "react"

/**
 * Where popups (selects, popovers, tooltips) render. Modals are `<dialog>`s
 * in the browser's top layer, so popups opened inside one must render inside
 * it too, or they'd sit behind it. Outside a modal this is `null` (the body).
 */
export const PortalContainerContext = createContext<HTMLElement | null>(null)

export const usePortalContainer = () =>
  useContext(PortalContainerContext) ?? undefined
