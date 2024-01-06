import { selector } from "recoil"
import { invokeListInstancePackageableCores } from "../../utils/invokes"
import { FolderWatchAtomFamily } from "../fileSystem/atoms"

export const instancePackagerCoresListSelector = selector<string[]>({
  key: "instancePackagerCoresList",
  get: async ({ get }) => {
    get(FolderWatchAtomFamily("Cores"))
    return await invokeListInstancePackageableCores()
  },
})
