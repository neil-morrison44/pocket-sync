import { useMemo } from "react"
import { useRecoilValue } from "recoil"
import { pocketPathAtom } from "../../recoil/atoms"
import {
  CoreInfoSelectorFamily,
  DataJSONSelectorFamily,
} from "../../recoil/selectors"
import { decodeDataParams } from "../../utils/decodeDataParams"
import { PlatformImage } from "../cores/platformImage"
import { Link } from "../link"
import { GameCount } from "./gameCount"

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

  const paths = useMemo(() => {
    if (!romsSlot || !platformIds) return []
    const coreSpecific = decodeDataParams(romsSlot.parameters)?.coreSpecific

    return platformIds.map(
      (pId) =>
        `${pocketPath}/Assets/${pId}/${coreSpecific ? coreName : "common"}`
    )
  }, [romsSlot, platformIds])

  if (paths.length === 0) return null

  console.log({ paths })

  return (
    <>
      {info.core.metadata.platform_ids.map((platformId, index) => (
        <Link href={paths[index]} key={platformId}>
          <PlatformImage
            className="cores__platform-image"
            platformId={platformId}
            key={platformId}
          />
          <div className="cores__info-blurb">
            {coreName}
            <GameCount
              platformId={platformId}
              extensions={romsSlot?.extensions || []}
            />
          </div>
        </Link>
      ))}
    </>
  )
}
