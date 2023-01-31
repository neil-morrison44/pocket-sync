import { path } from "@tauri-apps/api"
import { selector, selectorFamily } from "recoil"
import { invokeWalkDirListFiles } from "../../utils/invokes"
import { fileSystemInvalidationAtom } from "../atoms"

export const cueFilesSelector = selector<string[]>({
  key: "cueFilesSelector",
  get: async ({ get }) => {
    get(fileSystemInvalidationAtom)
    const files = await invokeWalkDirListFiles("Assets", ["cue"])
    return files
  },
})

export const BinFilesForCueFileSelectorFamily = selectorFamily<
  string[],
  string
>({
  key: "cueFilesSelector",
  get:
    (cuePath: string) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const folderPath = await path.dirname(cuePath)
      const files = await invokeWalkDirListFiles(`Assets/${folderPath}`, [
        "bin",
      ])
      return files
    },
})
