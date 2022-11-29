import { useRecoilCallback } from "recoil"
import {
  configInvalidationAtom,
  fileSystemInvalidationAtom,
  inventoryInvalidationAtom,
  saveFileInvalidationAtom,
} from "../recoil/atoms"

export const useInvalidateFileSystem = () =>
  useRecoilCallback(
    ({ set }) =>
      () => {
        set(fileSystemInvalidationAtom, Date.now())
      },
    []
  )

export const useInvalidateInventory = () =>
  useRecoilCallback(
    ({ set }) =>
      () => {
        set(inventoryInvalidationAtom, Date.now())
      },
    []
  )

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
