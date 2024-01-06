import { useRecoilCallback } from "recoil"
import {
  configInvalidationAtom,
  saveFileInvalidationAtom,
} from "../recoil/atoms"

export const useInvalidateConfig = () =>
  useRecoilCallback(
    ({ set }) =>
      () => {
        set(configInvalidationAtom, Date.now())
      },
    []
  )

export const useInvalidateSaveFiles = () =>
  useRecoilCallback(
    ({ set }) =>
      () => {
        set(saveFileInvalidationAtom, Date.now())
      },
    []
  )
