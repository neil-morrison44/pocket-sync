import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { createAppLocalStorage } from "../utils/jotai"

export const pocketPathAtom = atom<string | null>(null)

export const reconnectWhenOpenedAtom = atomWithStorage<{
  enable: boolean
  path: string
}>(
  "reconnect_when_opened",
  {
    enable: false,
    path: "",
  },
  createAppLocalStorage(),
  { getOnInit: true }
)

export const performanceLevelAtom = atomWithStorage<number>(
  "perf_level",
  2,
  createAppLocalStorage(),
  { getOnInit: true }
)

export const enableGlobalZipInstallAtom = atom<boolean>(true)
