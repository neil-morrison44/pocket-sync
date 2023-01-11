import { atomFamily } from "recoil"
import { InteractPersistJSON } from "../../types/interact"
import {
  invokeFileExists,
  invokeReadTextFile,
  invokeSaveFile,
} from "../../utils/invokes"
import { pocketPathAtom } from "../atoms"

export const PersistInteractFileAtomFamily = atomFamily<
  InteractPersistJSON,
  { coreName: string; filePath: "core" | string }
>({
  key: "PersistInteractFileAtomFamily",
  default: async ({ coreName, filePath }) => {
    const fileName =
      filePath === "core"
        ? `Settings/${coreName}/Interact/_core/interact_persist.json`
        : `/Settings/${coreName}/Interact/${filePath}`
    const exists = await invokeFileExists(fileName)
    if (!exists) return EMPTY_PERSIST
    const response = await invokeReadTextFile(fileName)
    return JSON.parse(response) as InteractPersistJSON
  },
  effects: ({ coreName, filePath }) => [
    ({ onSet, getPromise }) => {
      const fileName =
        filePath === "core"
          ? `Settings/${coreName}/Interact/_core/interact_persist.json`
          : `Settings/${coreName}/Interact/${filePath}`

      onSet(async (newValue) => {
        const pocketPath = await getPromise(pocketPathAtom)
        const encoder = new TextEncoder()
        await invokeSaveFile(
          `${pocketPath}/${fileName}`,
          encoder.encode(JSON.stringify(newValue, null, 2))
        )
      })
    },
  ],
})

const EMPTY_PERSIST: InteractPersistJSON = {
  interact_persist: {
    magic: "APF_VER_1",
    variables: [],
  },
}
