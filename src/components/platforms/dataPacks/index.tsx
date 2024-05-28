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
import { useTranslation } from "react-i18next"
import { invokeSaveMultipleFiles } from "../../../utils/invokes"

type DataPacksProps = {
  platformId?: PlatformId
  onClose: () => void
}

export const DataPacks = ({ onClose, platformId }: DataPacksProps) => {
  const imagePacks = useRecoilValue(imagePackListSelector)
  const platformIds = useRecoilValue(platformsListSelector)
  const { t } = useTranslation("platforms")

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
        const selectionEntries = Object.entries(selections)
        const encoder = new TextEncoder()

        const paths = []
        const jsons = []

        for (let index = 0; index < selectionEntries.length; index++) {
          const [platformId, pack] = selectionEntries[index]
          if (!pack) continue
          const packJson = await snapshot.getPromise(
            DataPackJsonSelectorFamily({ ...pack, platformId })
          )
          paths.push(`Platforms/${platformId}.json`)
          jsons.push(encoder.encode(JSON.stringify(packJson, null, 2)))
        }

        await invokeSaveMultipleFiles(paths, jsons)
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
          {t("data_packs.apply_changes", { count: applyCount })}
        </button>
        <button onClick={onClose}>{t("data_packs.close")}</button>
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
  selected: boolean
  onClick: () => void
}) => {
  const { t } = useTranslation("platforms")
  const currentJson = useRecoilValue(PlatformInfoSelectorFamily(platformId))
  const { platform } = currentJson

  return (
    <div
      className={`data-packs__current-item ${
        selected ? "data-packs__current-item--selected" : ""
      }`}
      onClick={onClick}
    >
      <div>{t("data_packs.current")}</div>
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
  selected: boolean
  onClick: () => void
}) => {
  const packJson = useRecoilValue(
    DataPackJsonSelectorFamily({ ...pack, platformId })
  )
  // console.log({ packJson })
  const currentJson = useRecoilValue(PlatformInfoSelectorFamily(platformId))

  if (!packJson) return null
  if (comparePlatforms(packJson, currentJson)) return null

  const { platform } = packJson

  const titleText = `${pack.owner}: ${pack.repository} ${
    pack.variant ? `- ${pack.variant}` : ""
  }`

  return (
    <div
      className={`data-packs__pack-item ${
        selected ? "data-packs__pack-item--selected" : ""
      }`}
      onClick={onClick}
    >
      <div>{titleText}</div>
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
