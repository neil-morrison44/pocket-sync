import { useMemo } from "react"

type useBEMParams = {
  block: string
  element?: string | null
  modifiers: { [key: string]: boolean }
}

export const useBEM = ({
  block,
  element = null,
  modifiers = {},
}: useBEMParams): string =>
  useMemo(() => {
    const className = element === null ? `${block}` : `${block}__${element}`
    const mods = Object.entries(modifiers)
      .filter(([, value]) => value)
      .map(([modifier]) => `${className}--${modifier}`)

    return `${className} ${mods.join(" ")}`.trim()
  }, [block, element, ...Object.keys(modifiers), ...Object.values(modifiers)])
