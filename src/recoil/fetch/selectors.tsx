import { selectorFamily } from "recoil"
import { FetchFileMetadataWithStatus } from "../../types"
import { pocketPathAtom } from "../atoms"
import { PathFileInfoSelectorFamily } from "../archive/selectors"
import { debug } from "@tauri-apps/plugin-log"

export const FetchInfoSelectorFamily = selectorFamily<
  {
    pocketPath: string
    pocketFileInfo: FetchFileMetadataWithStatus[]
    fsFileInfo: FetchFileMetadataWithStatus[]
  },
  { origin: string; destination: string }
>({
  key: "FetchInfoSelectorFamily",
  get:
    ({ origin, destination }) =>
    ({ get }) => {
      const pocketPath = get(pocketPathAtom) || ""
      const pocketFileInfo = get(
        PathFileInfoSelectorFamily({ path: destination })
      )
      const fsFileInfo = get(
        PathFileInfoSelectorFamily({ path: origin, offPocket: true })
      )

      return {
        pocketPath,
        pocketFileInfo,
        fsFileInfo,
      }
    },
})
