import { InteractJSON, InteractPersistJSON } from "../../types/interact"
import { readJSONFile } from "../../utils/readJSONFile"
import { FileWatchAtomFamily, FolderWatchAtomFamily } from "../fileSystem/atoms"
import { WalkDirSelectorFamily } from "../selectors"
import { atomFamily } from "jotai/utils"
import { atom, Atom } from "jotai"
import { atomFamilyDeepEqual } from "../../utils/jotai"

const CoreInteractFileSelectorFamily = atomFamily<
  string,
  Atom<Promise<InteractJSON>>
>((coreName) =>
  atom(async (get) => {
    const path = `Cores/${coreName}/interact.json`
    get(FileWatchAtomFamily(path))
    return readJSONFile<InteractJSON>(path)
  })
)

export const EMPTY_PERSIST: InteractPersistJSON = {
  interact_persist: {
    magic: "APF_VER_1",
    variables: [],
  },
}

export const ListPresetInteractSelectorFamily = atomFamily<
  string,
  Atom<Promise<string[]>>
>((coreName: string) =>
  atom(async (get) => {
    const path = `Presets/${coreName}/Interact`
    get(FolderWatchAtomFamily(path))
    const inputFiles = get(
      WalkDirSelectorFamily({ path, extensions: ["json"] })
    )
    return inputFiles
  })
)

export const PresetInteractFileSelectorFamily = atomFamilyDeepEqual<
  { coreName: string; filePath: string },
  Atom<Promise<InteractJSON>>
>(({ coreName, filePath }) =>
  atom(async (get) => {
    if (filePath === "core")
      return get(CoreInteractFileSelectorFamily(coreName))

    const path = `Presets/${coreName}/Interact/${filePath}`
    get(FileWatchAtomFamily(path))
    return readJSONFile<InteractJSON>(path)
  })
)
