import { selector } from "recoil"
import { invokeListInstancePackageableCores } from "../../utils/invokes"
import { fileSystemInvalidationAtom } from "../atoms"

export const instancePackagerCoresListSelector = selector<string[]>({
  key: "instancePackagerCoresList",
  get: async ({ get }) => {
    get(fileSystemInvalidationAtom)
    return await invokeListInstancePackageableCores()
  },
})
