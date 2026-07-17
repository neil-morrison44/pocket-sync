import { Suspense, useCallback, useMemo } from "react"
import { pocketPathAtom } from "../../jotai/atoms"
import {
  CoreInfoSelectorFamily,
  DataJSONSelectorFamily,
  FolderSizeSelectorFamily,
} from "../../jotai/selectors"
import { decodeDataParams } from "../../utils/decodeDataParams"
import { invokeCreateFolderIfMissing } from "../../utils/invokes"
import { PlatformImage } from "../cores/platformImage"
import { GameCount } from "./gameCount"
import { SearchContextSelfHidingConsumer } from "../search/context"
import { PlatformInfoSelectorFamily } from "../../jotai/platforms/selectors"
import { DataSlotJSON } from "../../types"
import { useAtomValue } from "jotai"
import { openFolder } from "../../utils/openFolder"

const NOT_REQUIRED_BUT_MAYBE_GAME_NAMES = /(^slot)/i

export const CoreFolderItem = ({ coreName }: { coreName: string }) => {
  const data = useAtomValue(DataJSONSelectorFamily(coreName))
  const pocketPath = useAtomValue(pocketPathAtom)
  const romsSlot = useMemo<DataSlotJSON | undefined>(
    () =>
      data.data.data_slots.filter(
        ({ required, name, extensions }) =>
          (required || name?.match(NOT_REQUIRED_BUT_MAYBE_GAME_NAMES)) &&
          extensions
      )[0],
    [data, coreName]
  )

  const decodedParams = useMemo(
    () => decodeDataParams(romsSlot?.parameters),
    [romsSlot?.parameters]
  )

  const { core } = useAtomValue(CoreInfoSelectorFamily(coreName))
  const platformId = core.metadata.platform_ids[decodedParams.platformIndex]
  const { platform } = useAtomValue(PlatformInfoSelectorFamily(platformId))

  const platformPath = useMemo(() => {
    if (!romsSlot) return ""
    return `${pocketPath}/Assets/${platformId}`
  }, [romsSlot, pocketPath, platformId])

  const path = useMemo(() => {
    if (!romsSlot) return ""
    const coreSpecific = decodedParams?.coreSpecific
    return `${pocketPath}/Assets/${platformId}/${
      coreSpecific ? coreName : "common"
    }`
  }, [romsSlot, decodedParams?.coreSpecific, platformPath, coreName])

  const onOpenFolder = useCallback(async (path: string) => {
    await invokeCreateFolderIfMissing(path)
    openFolder(path)
  }, [])

  if (!romsSlot) return null

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
      <div className="cores__item" onClick={() => onOpenFolder(path)}>
        <PlatformImage
          className="cores__platform-image"
          platformId={platformId}
        />
        <div className="cores__info-blurb">
          <b>{coreName}</b>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <GameCount
              platformId={platformId}
              coreName={coreName}
              extensions={romsSlot?.extensions || []}
            />
            <Suspense>
              <FolderSize path={platformPath} />
            </Suspense>
          </div>
          {(romsSlot?.extensions || []).map((e) => `.${e}`).join(", ")}
        </div>
      </div>
    </SearchContextSelfHidingConsumer>
  )
}

const FolderSize = ({ path }: { path: string }) => {
  const size = useAtomValue(FolderSizeSelectorFamily(path))
  return <span>{size}</span>
}
