import { selector, selectorFamily } from "recoil"
import {
  invokeReadBinaryFile,
  invokeWalkDirListFiles,
} from "../../utils/invokes"
import { fileSystemInvalidationAtom } from "../atoms"

export const AllSaveStatesSelector = selector<string[]>({
  key: "AllSaveStatesSelector",
  get: async ({ get }) => {
    get(fileSystemInvalidationAtom)
    const saves = await invokeWalkDirListFiles("Memories/Save States", [".sta"])
    return saves.map((f) => f.replace(/^\//g, ""))
  },
})

export const SaveStateBinarySelectorFamily = selectorFamily<Uint8Array, string>(
  {
    key: "SaveStateBinarySelectorFamily",
    get: (path) => async () => {
      const file = await invokeReadBinaryFile(`Memories/Save States/${path}`)
      return file
    },
  }
)
