import { FetchFileMetadataWithStatus } from "../../types"
import { pocketPathAtom } from "../atoms"
import { PathFileInfoSelectorFamily } from "../archive/selectors"
import { atomFamilyDeepEqual } from "../../utils/jotai"
import { atom, Atom } from "jotai"

export const FetchInfoSelectorFamily = atomFamilyDeepEqual<
  { origin: string; destination: string },
  Atom<
    Promise<{
      pocketPath: string
      pocketFileInfo: FetchFileMetadataWithStatus[]
      fsFileInfo: FetchFileMetadataWithStatus[]
    }>
  >
>(({ origin, destination }) =>
  atom(async (get) => {
    const pocketPath = (await get(pocketPathAtom)) || ""
    const pocketFileInfo = await get(
      PathFileInfoSelectorFamily({ path: destination })
    )
    const fsFileInfo = await get(
      PathFileInfoSelectorFamily({ path: origin, offPocket: true })
    )

    return {
      pocketPath,
      pocketFileInfo,
      fsFileInfo,
    }
  })
)
