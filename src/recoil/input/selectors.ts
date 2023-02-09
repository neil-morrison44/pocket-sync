import { selectorFamily } from "recoil"
import { InputJSON } from "../../types"
import { invokeWalkDirListFiles } from "../../utils/invokes"
import { readJSONFile } from "../../utils/readJSONFile"
import { fileSystemInvalidationAtom } from "../atoms"

export const CoreInputSelectorFamily = selectorFamily<InputJSON, string>({
  key: "CoreInputSelectorFamily",
  get:
    (coreName: string) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      return readJSONFile<InputJSON>(`Cores/${coreName}/input.json`)
    },
})

export const ListPresetInputsSelectorFamily = selectorFamily<string[], string>({
  key: "ListPresetInputsSelectorFamily",
  get:
    (coreName: string) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const inputFiles = invokeWalkDirListFiles(`Presets/${coreName}/Input`, [
        "json",
      ])

      return inputFiles
    },
})

export const PresetInputSelectorFamily = selectorFamily<
  InputJSON,
  { coreName: string; filePath: string }
>({
  key: "PresetInputSelectorFamily",
  get:
    ({ coreName, filePath }) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      if (filePath === "core") return get(CoreInputSelectorFamily(coreName))
      return readJSONFile<InputJSON>(`Presets/${coreName}/Input/${filePath}`)
    },
})
