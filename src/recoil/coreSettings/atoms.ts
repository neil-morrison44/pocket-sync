import { InteractPersistJSON } from "../../types/interact"
import { invokeFileExists, invokeSaveFile } from "../../utils/invokes"
import { readJSONFile } from "../../utils/readJSONFile"
import { pocketPathAtom } from "../atoms"
import { Atom, atom } from "jotai"
import { atomWithRefresh } from "jotai/utils"
import { atomFamilyDeepEqual } from "../../utils/jotai"

export const PersistInteractFileAtomFamily = atomFamilyDeepEqual(
  ({ coreName, filePath }: { coreName: string; filePath: string }) => {
    const fileName =
      filePath === "core"
        ? `Settings/${coreName}/Interact/_core/interact_persist.json`
        : `Settings/${coreName}/Interact/${filePath}`

    const baseAtom = atomWithRefresh(async () => {
      const exists = await invokeFileExists(fileName)
      if (!exists) return EMPTY_PERSIST
      return readJSONFile<InteractPersistJSON>(fileName)
    })

    return atom(
      (get) => get(baseAtom),
      async (get, set, newValue: InteractPersistJSON) => {
        const pocketPath = get(pocketPathAtom)
        const encoder = new TextEncoder()
        await invokeSaveFile(
          `${pocketPath}/${fileName}`,
          encoder.encode(JSON.stringify(newValue, null, 2))
        )

        set(baseAtom)
      }
    )
  }
)

const EMPTY_PERSIST: InteractPersistJSON = {
  interact_persist: {
    magic: "APF_VER_1",
    variables: [],
  },
}
