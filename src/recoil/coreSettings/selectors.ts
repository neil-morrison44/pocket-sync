import { selectorFamily } from "recoil"
import { InteractJSON, InteractPersistJSON } from "../../types/interact"
import { invokeWalkDirListFiles } from "../../utils/invokes"
import { readJSONFile } from "../../utils/readJSONFile"
import { FileWatchAtomFamily, FolderWatchAtomFamily } from "../fileSystem/atoms"

const CoreInteractFileSelectorFamily = selectorFamily<InteractJSON, string>({
  key: "CoreInteractFileSelectorFamily",
  get:
    (coreName) =>
    async ({ get }) => {
      const path = `Cores/${coreName}/interact.json`
      get(FileWatchAtomFamily(path))
      return readJSONFile<InteractJSON>(path)
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
      const path = `Presets/${coreName}/Interact`
      get(FolderWatchAtomFamily(path))
      const inputFiles = invokeWalkDirListFiles(path, ["json"])
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
      if (filePath === "core")
        return get(CoreInteractFileSelectorFamily(coreName))

      const path = `Presets/${coreName}/Interact/${filePath}`
      get(FileWatchAtomFamily(path))
      return readJSONFile<InteractJSON>(path)
    },
})
