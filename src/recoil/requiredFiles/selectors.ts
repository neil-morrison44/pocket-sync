import { selectorFamily } from "recoil"
import { RequiredFileInfo } from "../../types"
import { invokeFindRequiredFiles } from "../../utils/invokes"
import { skipAlternateAssetsSelector } from "../config/selectors"
import { archiveMetadataUrlSelector } from "../archive/selectors"

export const RequiredFileInfoSelectorFamily = selectorFamily<
  RequiredFileInfo[],
  string
>({
  key: "RequiredFileInfoSelectorFamily",
  get:
    (coreName) =>
    async ({ get }) => {
      const archiveMetadataUrl = get(archiveMetadataUrlSelector)
      const skipAlternateAssets = get(skipAlternateAssetsSelector)
      return await invokeFindRequiredFiles(
        coreName,
        !skipAlternateAssets,
        archiveMetadataUrl
      )
    },
})
