import { atomFamily } from "recoil"
import { InteractPersistJSON } from "../../types/interact"
import {
  invokeFileExists,
  invokeReadTextFile,
  invokeSaveFile,
} from "../../utils/invokes"
import { pocketPathAtom } from "../atoms"
import { settingsFolderReadonlySelector } from "./selectors"

export const CorePersistInteractFileAtomFamily = atomFamily<
  InteractPersistJSON,
  string
>({
  key: "CorePersistInteractFileAtomFamily",
  default: async (coreName) => {
    const fileName = `Settings/${coreName}/Interact/interact_persist.json`
    const exists = await invokeFileExists(fileName)
    if (!exists) {
      const otherFileName = `Settings/${coreName}/Interact/_core/interact_persist.json`
      const exists = await invokeFileExists(otherFileName)
      if (!exists) return EMPTY_PERSIST
      const response = await invokeReadTextFile(otherFileName)
      return JSON.parse(response) as InteractPersistJSON
    }
    const response = await invokeReadTextFile(fileName)
    return JSON.parse(response) as InteractPersistJSON
  },
  effects: (coreName) => [
    ({ onSet, getPromise }) => {
      onSet(async (newValue) => {
        const pocketPath = await getPromise(pocketPathAtom)
        const isReadyOnly = await getPromise(settingsFolderReadonlySelector)
        if (isReadyOnly) return
        const encoder = new TextEncoder()
        await invokeSaveFile(
          `${pocketPath}/Settings/${coreName}/Interact/interact_persist.json`,
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
