import { selectorFamily } from "recoil"
import { InputJSON } from "../../types"
import { invokeWalkDirListFiles } from "../../utils/invokes"
import { readJSONFile } from "../../utils/readJSONFile"
import { FileWatchAtomFamily, FolderWatchAtomFamily } from "../fileSystem/atoms"

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
      get(FolderWatchAtomFamily(path))
      const inputFiles = invokeWalkDirListFiles(path, ["json"])

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
      if (filePath === "core") return get(CoreInputSelectorFamily(coreName))
      const path = `Presets/${coreName}/Input${filePath}`
      get(FileWatchAtomFamily(path))
      return readJSONFile<InputJSON>(path)
    },
})
