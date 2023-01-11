import { selector, selectorFamily } from "recoil"
import { InteractJSON, InteractPersistJSON } from "../../types/interact"
import {
  invokeReadTextFile,
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

export const settingsFolderReadonlySelector = selector<boolean>({
  key: "settingsFolderReadonlySelector",
  get: async () => {
    return await invokeSettingsFolderReadonlyCheck()
  },
})

export const EMPTY_PERSIST: InteractPersistJSON = {
  interact_persist: {
    magic: "APF_VER_1",
    variables: [],
  },
}
