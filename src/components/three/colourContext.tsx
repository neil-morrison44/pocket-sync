import { ReactNode, createContext, useEffect, useState } from "react"
import { PocketSyncConfig } from "../../types"
import { useRecoilValue } from "recoil"
import { PocketSyncConfigSelector } from "../../recoil/config/selectors"

export const BodyColourContext =
  createContext<PocketSyncConfig["colour"]>("black")
export const ButtonsColourContext =
  createContext<PocketSyncConfig["colour"]>("black")

type ColourContextProviderProps = {
  buttons: PocketSyncConfig["colour"]
  body: PocketSyncConfig["colour"]
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

const ALL_COLOURS: PocketSyncConfig["colour"][] = [
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
]

export const ColourContextProviderRandomised = ({
  children,
  changeInterval,
}: {
  children: ReactNode
  changeInterval: number
}) => {
  const [bodyColour, setBodyColour] =
    useState<PocketSyncConfig["colour"]>("black")
  const [buttonsColour, setButtonsColour] =
    useState<PocketSyncConfig["colour"]>("black")

  useEffect(() => {
    const interval = setInterval(() => {
      setBodyColour(ALL_COLOURS[Math.floor(ALL_COLOURS.length * Math.random())])
      setButtonsColour(
        ALL_COLOURS[Math.floor(ALL_COLOURS.length * Math.random())]
      )
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
  const { colour } = useRecoilValue(PocketSyncConfigSelector)
  return (
    <ColourContextProvider body={colour} buttons={colour}>
      {children}
    </ColourContextProvider>
  )
}
