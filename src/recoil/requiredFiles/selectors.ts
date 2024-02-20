import { selectorFamily } from "recoil"
import { DataSlotFile } from "../../types"
import { invokeFindRequiredFiles } from "../../utils/invokes"
import { skipAlternateAssetsSelector } from "../config/selectors"
import { archiveMetadataUrlSelector } from "../archive/selectors"
import { FolderWatchAtomFamily } from "../fileSystem/atoms"
import { CoreAllPlatformIdsSelectorFamily } from "../selectors"

export const RequiredFileInfoSelectorFamily = selectorFamily<
  DataSlotFile[],
  string
>({
  key: "RequiredFileInfoSelectorFamily",
  get:
    (coreName) =>
    async ({ get }) => {
      const platformIds = get(CoreAllPlatformIdsSelectorFamily(coreName))
      platformIds.forEach((pid) => get(FolderWatchAtomFamily(`Assets/${pid}`)))

      const archiveMetadataUrl = get(archiveMetadataUrlSelector)
      const skipAlternateAssets = get(skipAlternateAssetsSelector)
      return await invokeFindRequiredFiles(
        coreName,
        !skipAlternateAssets,
        archiveMetadataUrl
      )
    },
})
