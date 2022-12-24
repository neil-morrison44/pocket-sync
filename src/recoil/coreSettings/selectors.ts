import { DefaultValue, selector, selectorFamily } from "recoil"
import { InteractJSON, InteractPersistJSON } from "../../types/interact"
import {
  invokeFileExists,
  invokeReadTextFile,
  invokeSaveFile,
  invokeSettingsFolderReadonlyCheck,
} from "../../utils/invokes"
import { fileSystemInvalidationAtom } from "../atoms"

export const CoreInteractFileSelectorFamily = selectorFamily<
  InteractJSON,
  string
>({
  key: "CoreInteractFileSelectorFamily",
  get:
    (coreName) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const response = await invokeReadTextFile(
        `Cores/${coreName}/interact.json`
      )

      return JSON.parse(response) as InteractJSON
    },
})

export const CorePersistInteractFileSectorFamily = selectorFamily<
  InteractPersistJSON,
  string
>({
  key: "CorePersistInteractFileSectorFamily",
  get:
    (coreName) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const fileName = `Settings/${coreName}/Interact/interact_persist.json`
      const exists = await invokeFileExists(fileName)

      if (!exists) return EMPTY_PERSIST

      const response = await invokeReadTextFile(fileName)
      return JSON.parse(response) as InteractPersistJSON
    },
})

export const settingsFolderReadonlySelector = selector<boolean>({
  key: "settingsFolderReadonlySelector",
  get: async () => {
    console.log(await invokeSettingsFolderReadonlyCheck())
    return await invokeSettingsFolderReadonlyCheck()
  },
})

export const EMPTY_PERSIST: InteractPersistJSON = {
  interact_persist: {
    magic: "APF_VER_1",
    variables: [],
  },
}
