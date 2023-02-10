import { selectorFamily } from "recoil"
import { InteractJSON, InteractPersistJSON } from "../../types/interact"
import { invokeWalkDirListFiles } from "../../utils/invokes"
import { readJSONFile } from "../../utils/readJSONFile"
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
      return readJSONFile<InteractJSON>(`Cores/${coreName}/interact.json`)
    },
})

export const EMPTY_PERSIST: InteractPersistJSON = {
  interact_persist: {
    magic: "APF_VER_1",
    variables: [],
  },
}

export const ListPresetInteractSelectorFamily = selectorFamily<
  string[],
  string
>({
  key: "ListPresetInteractSelectorFamily",
  get:
    (coreName: string) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const inputFiles = invokeWalkDirListFiles(
        `Presets/${coreName}/Interact`,
        ["json"]
      )

      return inputFiles
    },
})

export const PresetInteractFileSelectorFamily = selectorFamily<
  InteractJSON,
  { coreName: string; filePath: string }
>({
  key: "PresetInteractFileSelectorFamily",
  get:
    ({ coreName, filePath }) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)

      if (filePath === "core")
        return get(CoreInteractFileSelectorFamily(coreName))

      return readJSONFile<InteractJSON>(
        `Presets/${coreName}/Interact/${filePath}`
      )
    },
})
