import { useCallback, useMemo } from "react"
import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { pocketPathAtom } from "../../recoil/atoms"
import {
  CoreInfoSelectorFamily,
  DataJSONSelectorFamily,
} from "../../recoil/selectors"
import { decodeDataParams } from "../../utils/decodeDataParams"
import { invokeCreateFolderIfMissing } from "../../utils/invokes"
import { PlatformImage } from "../cores/platformImage"
import { GameCount } from "./gameCount"
import { open } from "@tauri-apps/plugin-shell"
import { SearchContextSelfHidingConsumer } from "../search/context"
import { PlatformInfoSelectorFamily } from "../../recoil/platforms/selectors"
import { DataSlotJSON } from "../../types"

const NOT_REQUIRED_BUT_MAYBE_GAME_NAMES = /(^slot)/i

export const CoreFolderItem = ({ coreName }: { coreName: string }) => {
  const data = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    DataJSONSelectorFamily(coreName)
  )
  const pocketPath = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(pocketPathAtom)
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

  const { core } = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    CoreInfoSelectorFamily(coreName)
  )
  const platformId = core.metadata.platform_ids[decodedParams.platformIndex]
  const { platform } = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    PlatformInfoSelectorFamily(platformId)
  )

  const path = useMemo(() => {
    if (!romsSlot) return ""
    const coreSpecific = decodedParams?.coreSpecific
    return `${pocketPath}/Assets/${platformId}/${
      coreSpecific ? coreName : "common"
    }`
  }, [romsSlot, decodedParams?.coreSpecific, pocketPath, platformId, coreName])

  const onOpenFolder = useCallback(async (path: string) => {
    await invokeCreateFolderIfMissing(path)
    open(path)
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
          <GameCount
            platformId={platformId}
            coreName={coreName}
            extensions={romsSlot?.extensions || []}
          />

          {(romsSlot?.extensions || []).map((e) => `.${e}`).join(", ")}
        </div>
      </div>
    </SearchContextSelfHidingConsumer>
  )
}
