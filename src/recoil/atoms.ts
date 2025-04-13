import { atom } from "jotai"
import { atomWithAppLocalStorage } from "../utils/jotai"

export const pocketPathAtom = atom<string | null>(null)

export const reconnectWhenOpenedAtom = atomWithAppLocalStorage<{
  enable: boolean
  path: string
}>("reconnect_when_opened", {
  enable: false,
  path: "",
})

export const performanceLevelAtom = atomWithAppLocalStorage<number>(
  "perf_level",
  2
)

export const enableGlobalZipInstallAtom = atom<boolean>(true)
