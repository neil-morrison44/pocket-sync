import { atomFamily } from "recoil"
import { registerFilePath } from "./fsEventRegister"

export const FileWatchAtomFamily = atomFamily<number, string>({
  key: "FileWatchAtomFamily",
  default: Date.now(),

  effects: (path) => [
    ({ setSelf }) => {
      const unregister = registerFilePath(path, () => {
        setSelf(Date.now())
      })
      return () => unregister()
    },
  ],
})

export const FolderWatchAtomFamily = atomFamily<number, string>({
  key: "FolderWatchAtomFamily",
  default: Date.now(),

  effects: (path) => [
    ({ setSelf }) => {
      const unregister = registerFilePath(path, () => {
        setSelf(Date.now())
      })

      return () => unregister()
    },
  ],
})
