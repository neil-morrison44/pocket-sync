import { Suspense, useCallback, useMemo, useState } from "react"

import {
  DataPackJsonSelectorFamily,
  PlatformInfoSelectorFamily,
  PlatformIsArchivedSelectorFamily,
  imagePackListSelector,
  platformsListSelector,
} from "../../../jotai/platforms/selectors"
import { PlatformId, ImagePack, PlatformInfoJSON } from "../../../types"
import { Modal, ModalSuspense } from "../../modal"

import "./index.css"
import Button from "../../ui/Button"
import { PackLane, PackOption, packLabel } from "../packs"
import { useTranslation } from "react-i18next"
import { invokeSaveMultipleFiles } from "../../../utils/invokes"
import { useAtomValue } from "jotai"
import { useAtomCallback } from "jotai/utils"
import { OnlyLoadsWhenShown } from "../../../utils/onlyLoadsWhenShown"

type DataPacksProps = {
  platformId?: PlatformId
  onClose: () => void
}

const DataPacksContent = ({ onClose, platformId }: DataPacksProps) => {
  const imagePacks = useAtomValue(imagePackListSelector)
  const platformIds = useAtomValue(platformsListSelector)
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

  const apply = useAtomCallback(
    useCallback(
      async (get, _set) => {
        const selectionEntries = Object.entries(selections)
        const encoder = new TextEncoder()

        const paths = []
        const jsons = []

        for (let index = 0; index < selectionEntries.length; index++) {
          const [platformId, pack] = selectionEntries[index]
          if (!pack) continue
          const packJson = await get(
            DataPackJsonSelectorFamily({ ...pack, platformId })
          )
          const isArchived = await get(
            PlatformIsArchivedSelectorFamily(platformId)
          )
          paths.push(
            `Platforms/${isArchived ? "_archive/" : ""}${platformId}.json`
          )
          jsons.push(encoder.encode(JSON.stringify(packJson, null, 2)))
        }

        await invokeSaveMultipleFiles(paths, jsons)
        onClose()
      },
      [selections]
    )
  )

  return (
    <Modal
      className="data-packs"
      title={t("controls.data_packs")}
      onClose={onClose}
    >
      <p className="packs__intro">{t("data_packs.intro")}</p>
      <div className="packs__lanes">
        {sortedPlatformIds.map((platformId) => (
          <OnlyLoadsWhenShown height={120} key={platformId}>
            <Suspense>
              <PackLane platformId={platformId}>
                <CurrentJSON
                  platformId={platformId}
                  selected={selections[platformId] === undefined}
                  onClick={() =>
                    setSelections((s) => ({ ...s, [platformId]: undefined }))
                  }
                />
                {imagePacks.map((pack) => (
                  <Suspense key={pack.repository + pack.variant + pack.owner}>
                    <JsonInPack
                      pack={pack}
                      platformId={platformId}
                      onClick={() =>
                        setSelections((s) => ({ ...s, [platformId]: pack }))
                      }
                      selected={selections[platformId] === pack}
                    />
                  </Suspense>
                ))}
              </PackLane>
            </Suspense>
          </OnlyLoadsWhenShown>
        ))}
      </div>
      <div className="modal__actions">
        <Button theme="tertiary" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button theme="primary" disabled={applyCount === 0} onClick={apply}>
          {t("data_packs.apply_changes", { count: applyCount })}
        </Button>
      </div>
    </Modal>
  )
}

/** A platform's name, category, maker and year, as an option's content. */
const PlatformFacts = ({
  platform,
}: {
  platform: PlatformInfoJSON["platform"]
}) => (
  <>
    <strong>{platform.name}</strong>
    {platform.category && <span>{platform.category}</span>}
    <span>
      {[platform.manufacturer, platform.year].filter(Boolean).join(", ")}
    </span>
  </>
)

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
  const { platform } = useAtomValue(PlatformInfoSelectorFamily(platformId))

  return (
    <PackOption
      label={t("data_packs.current")}
      selected={selected}
      onSelect={onClick}
    >
      <PlatformFacts platform={platform} />
    </PackOption>
  )
}

/** A pack's version of the platform; nothing if it's the same as now. */
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
  const packJson = useAtomValue(
    DataPackJsonSelectorFamily({ ...pack, platformId })
  )
  const currentJson = useAtomValue(PlatformInfoSelectorFamily(platformId))

  if (!packJson) return null
  if (comparePlatforms(packJson, currentJson)) return null

  return (
    <PackOption label={packLabel(pack)} selected={selected} onSelect={onClick}>
      <PlatformFacts platform={packJson.platform} />
    </PackOption>
  )
}

const comparePlatforms = (a: PlatformInfoJSON, b: PlatformInfoJSON) => {
  return Object.entries(a.platform).every(([key, value]) => {
    //@ts-ignore TS not being smart enough
    return b.platform[key] == value
  })
}

/** Opens right away with a loader while its data loads. */
export const DataPacks = (props: DataPacksProps) => {
  const { t } = useTranslation("platforms")
  return (
    <ModalSuspense
      className="data-packs"
      title={t("controls.data_packs")}
      onClose={props.onClose}
    >
      <DataPacksContent {...props} />
    </ModalSuspense>
  )
}
