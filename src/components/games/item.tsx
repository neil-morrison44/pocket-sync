import { useCallback, useMemo } from "react"
import { useRecoilValue } from "recoil"
import { pocketPathAtom } from "../../recoil/atoms"
import {
  CoreMainPlatformIdSelectorFamily,
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
  const data = useRecoilValue(DataJSONSelectorFamily(coreName))
  const pocketPath = useRecoilValue(pocketPathAtom)

  const romsSlot = useMemo(
    () =>
      data.data.data_slots.filter(
        ({ required, extensions }) => required && extensions
      )[0],
    [data]
  )

  const mainPlatformId = useRecoilValue(
    CoreMainPlatformIdSelectorFamily(coreName)
  )
  const { platform } = useRecoilValue(
    PlatformInfoSelectorFamily(mainPlatformId)
  )

  const path = useMemo(() => {
    if (!romsSlot) return ""
    const coreSpecific = decodeDataParams(romsSlot.parameters)?.coreSpecific
    return `${pocketPath}/Assets/${mainPlatformId}/${
      coreSpecific ? coreName : "common"
    }`
  }, [romsSlot, mainPlatformId, pocketPath, coreName])

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
          platformId={mainPlatformId}
        />
        <div className="cores__info-blurb">
          <b>{coreName}</b>
          <GameCount
            platformId={mainPlatformId}
            coreName={coreName}
            extensions={romsSlot?.extensions || []}
          />

          {(romsSlot?.extensions || []).map((e) => `.${e}`).join(", ")}
        </div>
      </div>
    </SearchContextSelfHidingConsumer>
  )
}
