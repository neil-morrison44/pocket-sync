import { invokeListInstancePackageableCores } from "../../utils/invokes"
import { FolderWatchAtomFamily } from "../fileSystem/atoms"
import { atom } from "jotai"

export const instancePackagerCoresListSelector = atom<Promise<string[]>>(
  async (get) => {
    get(FolderWatchAtomFamily("Cores"))
    return await invokeListInstancePackageableCores()
  }
)
