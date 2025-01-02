import { selectorFamily } from "recoil"
import { InputJSON } from "../../types"
import { readJSONFile } from "../../utils/readJSONFile"
import { FileWatchAtomFamily, FolderWatchAtomFamily } from "../fileSystem/atoms"
import { WalkDirSelectorFamily } from "../selectors"

const CoreInputSelectorFamily = selectorFamily<InputJSON, string>({
  key: "CoreInputSelectorFamily",
  get:
    (coreName: string) =>
    async ({ get }) => {
      const path = `Cores/${coreName}/input.json`
      get(FolderWatchAtomFamily(path))
      return readJSONFile<InputJSON>(path)
    },
})

export const ListPresetInputsSelectorFamily = selectorFamily<string[], string>({
  key: "ListPresetInputsSelectorFamily",
  get:
    (coreName: string) =>
    async ({ get }) => {
      const path = `Presets/${coreName}/Input`
      return get(WalkDirSelectorFamily({ path, extensions: ["json"] }))
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
      if (filePath === "core") return get(CoreInputSelectorFamily(coreName))
      const path = `Presets/${coreName}/Input${filePath}`
      get(FileWatchAtomFamily(path))
      return readJSONFile<InputJSON>(path)
    },
})
