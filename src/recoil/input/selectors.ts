import { selectorFamily } from "recoil"
import { InputJSON } from "../../types"
import { invokeReadTextFile, invokeWalkDirListFiles } from "../../utils/invokes"
import { fileSystemInvalidationAtom } from "../atoms"

export const CoreInputSelectorFamily = selectorFamily<InputJSON, string>({
  key: "CoreInputSelectorFamily",
  get:
    (coreName: string) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const response = await invokeReadTextFile(`Cores/${coreName}/input.json`)
      return JSON.parse(response) as InputJSON
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
      const response = await invokeReadTextFile(
        `Presets/${coreName}/Input/${filePath}`
      )
      return JSON.parse(response) as InputJSON
    },
})
