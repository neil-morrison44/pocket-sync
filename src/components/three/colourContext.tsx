import {
  ReactNode,
  createContext,
  startTransition,
  useLayoutEffect,
  useState,
} from "react"
import { PocketColour } from "../../types"

import { PocketSyncConfigSelector } from "../../recoil/config/selectors"
import { useAtomValue } from "jotai"

export const BodyColourContext = createContext<PocketColour>("black")
export const ButtonsColourContext = createContext<PocketColour>("black")

type ColourContextProviderProps = {
  buttons: PocketColour
  body: PocketColour
  children: ReactNode
}

export const ColourContextProvider = ({
  buttons,
  body,
  children,
}: ColourContextProviderProps) => {
  return (
    <BodyColourContext.Provider value={body}>
      <ButtonsColourContext.Provider value={buttons}>
        {children}
      </ButtonsColourContext.Provider>
    </BodyColourContext.Provider>
  )
}

const ALL_COLOURS: PocketColour[] = [
  "black",
  "white",
  "glow",
  "trans_purple",
  "trans_orange",
  "trans_blue",
  "trans_clear",
  "trans_green",
  "trans_red",
  "trans_smoke",
  "indigo",
  "red",
  "green",
  "blue",
  "yellow",
  "pink",
  "orange",
  "silver",
  "aluminium_natural",
  "aluminium_noir",
  "aluminium_black",
  "aluminium_indigo",
  "gbc_kiwi",
  "gbc_dandelion",
  "gbc_teal",
  "gbc_grape",
  "gbc_berry",
  "gbc_gold",
]

export const ColourContextProviderRandomised = ({
  children,
  changeInterval,
}: {
  children: ReactNode
  changeInterval: number
}) => {
  const [bodyColour, setBodyColour] = useState<PocketColour>("black")
  const [buttonsColour, setButtonsColour] = useState<PocketColour>("black")

  useLayoutEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => {
        setBodyColour(
          ALL_COLOURS[Math.floor(ALL_COLOURS.length * Math.random())]
        )
        setButtonsColour(
          ALL_COLOURS[Math.floor(ALL_COLOURS.length * Math.random())]
        )
      })
    }, changeInterval)

    return () => clearInterval(interval)
  }, [setBodyColour, setButtonsColour, changeInterval])

  return (
    <ColourContextProvider body={bodyColour} buttons={buttonsColour}>
      {children}
    </ColourContextProvider>
  )
}

export const ColourContextProviderFromConfig = ({
  children,
}: {
  children: ReactNode
}) => {
  const { colour, button_colour } = useAtomValue(PocketSyncConfigSelector)
  return (
    <ColourContextProvider body={colour} buttons={button_colour ?? colour}>
      {children}
    </ColourContextProvider>
  )
}
