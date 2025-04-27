import { registerFilePath } from "./fsEventRegister"
import { Atom, atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { withAtomEffect } from "jotai-effect"

export const FileWatchAtomFamily = atomFamily<string, Atom<number>>(
  (path: string) => {
    const baseAtom = atom(Date.now())
    return withAtomEffect(baseAtom, (_get, set) => {
      const unregister = registerFilePath(path, () => {
        set(baseAtom, Date.now())
      })

      return () => unregister()
    })
  }
)

export const FolderWatchAtomFamily = atomFamily<string, Atom<number>>(
  (path: string) => {
    const baseAtom = atom(Date.now())
    return withAtomEffect(baseAtom, (_get, set) => {
      const unregister = registerFilePath(path, () => {
        set(baseAtom, Date.now())
      })

      return () => unregister()
    })
  }
)
