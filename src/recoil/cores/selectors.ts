import { selector, selectorFamily } from "recoil"
import { CoreInfoSelectorFamily, coresListSelector } from "../selectors"
import { coreInventoryAtom } from "../inventory/atoms"
import { FileWatchAtomFamily } from "../fileSystem/atoms"
import { invokeFileExists, invokeReadTextFile } from "../../utils/invokes"

type UpdateInfo = {
  coreName: string
  installedVersion: string
  latestVersion: string
}

export const installedCoresWithUpdatesSelector = selector<UpdateInfo[]>({
  key: "installedCoresWithUpdatesSelector",
  get: ({ get }) => {
    const installedCores = get(coresListSelector)
    const coreInventory = get(coreInventoryAtom)

    return installedCores
      .map((coreName) => {
        const coreInfo = get(CoreInfoSelectorFamily(coreName))
        const inventoryItem = coreInventory.data.find(
          ({ identifier }) => coreName === identifier
        )
        return {
          coreName,
          installedVersion: coreInfo.core.metadata.version,
          latestVersion: inventoryItem?.version,
        }
      })
      .filter(
        ({ installedVersion, latestVersion }) =>
          latestVersion && installedVersion !== latestVersion
      ) as UpdateInfo[]
  },
})

export const CoreInfoTxtSelectorFamily = selectorFamily<string, string>({
  key: "CoreInfoTxtSelectorFamily",
  get:
    (coreName) =>
    async ({ get }) => {
      const path = `Cores/${coreName}/info.txt`

      get(FileWatchAtomFamily(path))

      const exists = await invokeFileExists(path)

      if (!exists) return ""

      const text = await invokeReadTextFile(path)

      return text
    },
})
