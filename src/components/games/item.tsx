import { useCallback, useMemo } from "react"
import { useRecoilValue } from "recoil"
import { pocketPathAtom } from "../../recoil/atoms"
import {
  CoreInfoSelectorFamily,
  DataJSONSelectorFamily,
} from "../../recoil/selectors"
import { decodeDataParams } from "../../utils/decodeDataParams"
import { invokeCreateFolderIfMissing } from "../../utils/invokes"
import { PlatformImage } from "../cores/platformImage"
import { GameCount } from "./gameCount"
import { open } from "@tauri-apps/api/shell"
import { SearchContextSelfHidingConsumer } from "../search/context"
import { PlatformInfoSelectorFamily } from "../../recoil/platforms/selectors"

export const CoreFolderItem = ({ coreName }: { coreName: string }) => {
  const info = useRecoilValue(CoreInfoSelectorFamily(coreName))
  const data = useRecoilValue(DataJSONSelectorFamily(coreName))
  const pocketPath = useRecoilValue(pocketPathAtom)

  const romsSlot = useMemo(
    () =>
      data.data.data_slots
        .filter(({ required, extensions }) => required && extensions)
        .at(0),
    [data]
  )

  const platformIds = useMemo(() => info.core.metadata.platform_ids, [info])
  const { platform } = useRecoilValue(
    PlatformInfoSelectorFamily(info.core.metadata.platform_ids[0])
  )

  const paths = useMemo(() => {
    if (!romsSlot || !platformIds) return []
    const coreSpecific = decodeDataParams(romsSlot.parameters)?.coreSpecific

    return platformIds.map(
      (pId) =>
        `${pocketPath}/Assets/${pId}/${coreSpecific ? coreName : "common"}`
    )
  }, [romsSlot, platformIds])

  const onOpenFolder = useCallback(async (path: string) => {
    await invokeCreateFolderIfMissing(path)
    open(path)
  }, [])

  if (paths.length === 0) return null

  return (
    <SearchContextSelfHidingConsumer
      fields={[
        coreName,
        platform.manufacturer,
        platform.name,
        platform.category || "",
      ]}
      otherFn={({ category }) => {
        if (category === "All") return true
        return category === platform.category
      }}
    >
      {info.core.metadata.platform_ids.map((platformId, index) => (
        <div
          className="cores__item"
          onClick={() => onOpenFolder(paths[index])}
          key={platformId}
        >
          <PlatformImage
            className="cores__platform-image"
            platformId={platformId}
            key={platformId}
          />
          <div className="cores__info-blurb">
            {coreName}
            <GameCount
              platformId={platformId}
              coreName={coreName}
              extensions={romsSlot?.extensions || []}
            />
          </div>
        </div>
      ))}
    </SearchContextSelfHidingConsumer>
  )
}
