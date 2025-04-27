import { DataSlotFile } from "../../types"
import { invokeFindRequiredFiles } from "../../utils/invokes"
import { skipAlternateAssetsSelector } from "../config/selectors"
import { archiveMetadataUrlSelector } from "../archive/selectors"
import { FolderWatchAtomFamily } from "../fileSystem/atoms"
import { CoreAllPlatformIdsSelectorFamily } from "../selectors"
import { atom, Atom } from "jotai"
import { atomFamily } from "jotai/utils"

export const RequiredFileInfoSelectorFamily = atomFamily<
  string,
  Atom<Promise<DataSlotFile[]>>
>((coreName) =>
  atom(async (get) => {
    const platformIds = await get(CoreAllPlatformIdsSelectorFamily(coreName))
    platformIds.forEach((pid) => get(FolderWatchAtomFamily(`Assets/${pid}`)))

    const archiveMetadataUrl = await get(archiveMetadataUrlSelector)
    const skipAlternateAssets = await get(skipAlternateAssetsSelector)
    return await invokeFindRequiredFiles(
      coreName,
      !skipAlternateAssets,
      archiveMetadataUrl
    )
  })
)
