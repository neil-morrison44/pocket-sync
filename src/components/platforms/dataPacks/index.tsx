import { useMemo, useState } from "react"
import { useRecoilCallback, useRecoilValue } from "recoil"
import {
  DataPackJsonSelectorFamily,
  PlatformInfoSelectorFamily,
  imagePackListSelector,
  platformsListSelector,
} from "../../../recoil/platforms/selectors"
import { PlatformId, ImagePack, PlatformInfoJSON } from "../../../types"
import { Modal } from "../../modal"

import "./index.css"
import { invokeSaveFile } from "../../../utils/invokes"
import { pocketPathAtom } from "../../../recoil/atoms"
import { useInvalidateFileSystem } from "../../../hooks/invalidation"

type DataPacksProps = {
  platformId?: PlatformId
  onClose: () => void
}

export const DataPacks = ({ onClose, platformId }: DataPacksProps) => {
  const imagePacks = useRecoilValue(imagePackListSelector)
  const platformIds = useRecoilValue(platformsListSelector)
  const invalidateFS = useInvalidateFileSystem()

  const sortedPlatformIds = useMemo(() => {
    if (platformId) return [platformId]

    return [...platformIds].sort((a, b) => a.localeCompare(b))
  }, [platformIds, platformId])

  const [selections, setSelections] = useState<
    Record<PlatformId, ImagePack | undefined>
  >({})

  const applyCount = useMemo(() => {
    return Object.entries(selections).filter(
      ([_key, value]) => value !== undefined
    ).length
  }, [selections])

  const apply = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const pocketPath = await snapshot.getPromise(pocketPathAtom)
        const selectionEntries = Object.entries(selections)
        const encoder = new TextEncoder()
        for (let index = 0; index < selectionEntries.length; index++) {
          const [platformId, pack] = selectionEntries[index]
          if (!pack) continue
          const packJson = await snapshot.getPromise(
            DataPackJsonSelectorFamily({ ...pack, platformId })
          )
          await invokeSaveFile(
            `${pocketPath}/Platforms/${platformId}.json`,
            encoder.encode(JSON.stringify(packJson, null, 2))
          )
        }
        invalidateFS()
        onClose()
      },
    [selections]
  )

  return (
    <Modal className="data-packs">
      <div className="data-packs__content">
        {sortedPlatformIds.map((platformId) => (
          <div key={platformId} className="data-packs__lane">
            <CurrentJSON
              key={platformId}
              platformId={platformId}
              selected={selections[platformId] === undefined}
              onClick={() =>
                setSelections((s) => ({ ...s, [platformId]: undefined }))
              }
            />
            {imagePacks.map((pack) => (
              <JsonInPack
                key={pack.repository + pack.variant}
                pack={pack}
                platformId={platformId}
                onClick={() =>
                  setSelections((s) => ({ ...s, [platformId]: pack }))
                }
                selected={selections[platformId] === pack}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="data-packs__buttons">
        <button onClick={apply}>
          {"data_packs.apply"}
          {applyCount}
        </button>
        <button onClick={onClose}>{"data_packs.close"}</button>
      </div>
    </Modal>
  )
}

const CurrentJSON = ({
  platformId,
  selected,
  onClick,
}: {
  platformId: string
  selected: Boolean
  onClick: () => void
}) => {
  const currentJson = useRecoilValue(PlatformInfoSelectorFamily(platformId))
  const { platform } = currentJson

  return (
    <div
      className={`data-packs__current-item ${
        selected ? "data-packs__current-item--selected" : ""
      }`}
      onClick={onClick}
    >
      <div>{`Current`}</div>
      <div className="cores__info-blurb">
        <strong>{platform.name}</strong>
        {platform.category ?? <div>{platform.category}</div>}
        <div>{platform.manufacturer}</div>
        <div>{platform.year}</div>
      </div>
    </div>
  )
}

const JsonInPack = ({
  pack,
  platformId,
  selected,
  onClick,
}: {
  pack: ImagePack
  platformId: string
  selected: Boolean
  onClick: () => void
}) => {
  const packJson = useRecoilValue(
    DataPackJsonSelectorFamily({ ...pack, platformId })
  )
  const currentJson = useRecoilValue(PlatformInfoSelectorFamily(platformId))

  if (!packJson) return null
  if (comparePlatforms(packJson, currentJson)) return null

  const { platform } = packJson

  return (
    <div
      className={`data-packs__pack-item ${
        selected ? "data-packs__pack-item--selected" : ""
      }`}
      onClick={onClick}
    >
      <div>{`${pack.owner}: ${pack.repository} ${
        pack.variant ? `- ${pack.variant}` : ""
      }`}</div>
      <div className="cores__info-blurb">
        <strong>{platform.name}</strong>
        {platform.category ?? <div>{platform.category}</div>}
        <div>{platform.manufacturer}</div>
        <div>{platform.year}</div>
      </div>
    </div>
  )
}

const comparePlatforms = (a: PlatformInfoJSON, b: PlatformInfoJSON) => {
  return Object.entries(a.platform).every(([key, value]) => {
    //@ts-ignore TS not being smart enough
    return b.platform[key] == value
  })
}
