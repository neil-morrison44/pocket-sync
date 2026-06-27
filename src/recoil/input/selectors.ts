import { atomFamily } from "jotai/utils"
import { InputJSON } from "../../types"
import { readJSONFile } from "../../utils/readJSONFile"
import { fsWatchAtomFamily } from "../fileSystem/atoms"
import { WalkDirSelectorFamily } from "../selectors"
import { atom, Atom } from "jotai"
import { atomFamilyDeepEqual } from "../../utils/jotai"

const CoreInputSelectorFamily = atomFamily<string, Atom<Promise<InputJSON>>>(
  (coreName: string) =>
    atom(async (get) => {
      const path = `Cores/${coreName}/input.json`
      get(fsWatchAtomFamily(path))
      return readJSONFile<InputJSON>(path)
    })
)

export const ListPresetInputsSelectorFamily = atomFamily<
  string,
  Atom<Promise<string[]>>
>((coreName: string) =>
  atom(async (get) => {
    const path = `Presets/${coreName}/Input`
    return get(WalkDirSelectorFamily({ path, extensions: ["json"] }))
  })
)

export const PresetInputSelectorFamily = atomFamilyDeepEqual<
  { coreName: string; filePath: string },
  Atom<Promise<InputJSON>>
>(({ coreName, filePath }) =>
  atom(async (get) => {
    if (filePath === "core") return get(CoreInputSelectorFamily(coreName))
    const path = `Presets/${coreName}/Input${filePath}`
    get(fsWatchAtomFamily(path))
    return readJSONFile<InputJSON>(path)
  })
)
