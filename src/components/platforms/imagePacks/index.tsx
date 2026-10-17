import { Suspense, useCallback, useMemo, useState } from "react"
import {
  ImagePackImageSelectorFamily,
  imagePackListSelector,
  platformsListSelector,
} from "../../../jotai/platforms/selectors"
import { ImagePack, PlatformId } from "../../../types"
import { PlatformImage } from "../../cores/platformImage"
import { Modal, ModalSuspense } from "../../modal"
import { useTranslation } from "react-i18next"

import "./index.css"
import Button from "../../ui/Button"
import { PackLane, PackOption, packLabel } from "../packs"
import { OnlyLoadsWhenShown } from "../../../utils/onlyLoadsWhenShown"
import { invokeSaveMultipleFiles } from "../../../utils/invokes"
import { useAtomValue } from "jotai"
import { useAtomCallback } from "jotai/utils"

type ImagePacksProps = {
  onClose: () => void
  singlePlatformId?: PlatformId
}

const ImagePacksContent = ({ onClose, singlePlatformId }: ImagePacksProps) => {
  const allPlatformIds = useAtomValue(platformsListSelector)
  const platformIds = useMemo(() => {
    if (singlePlatformId) return [singlePlatformId]
    return allPlatformIds
  }, [allPlatformIds, singlePlatformId])

  const imagePacks = useAtomValue(imagePackListSelector)

  const imagePackSorted = useMemo(() => {
    if (singlePlatformId) {
      return imagePacks.filter(({ image_platforms }) =>
        image_platforms.includes(singlePlatformId)
      )
    }

    const sorted = [...imagePacks]
    return sorted.sort(
      (a, b) => b.image_platforms.length - a.image_platforms.length
    )
  }, [imagePacks])

  const [selections, setSelections] = useState<
    Record<PlatformId, ImagePack | undefined>
  >({})

  const changeCount = Object.values(selections).filter(Boolean).length
  const { t } = useTranslation("platforms")

  const applyChanges = useAtomCallback(
    useCallback(
      async (get, set) => {
        const paths = []
        const images = []

        for (const platformId in selections) {
          const pack = selections[platformId]
          if (!pack) continue
          const image = await get(
            ImagePackImageSelectorFamily({ ...pack, platformId })
          )
          if (!image) continue

          const imageData = new Uint8Array(await image.file.arrayBuffer())

          paths.push(`Platforms/_images/${platformId}.bin`)
          images.push(imageData)
        }

        await invokeSaveMultipleFiles(paths, images)
        onClose()
      },
      [selections]
    )
  )

  return (
    <Modal
      className="image-packs"
      title={t("controls.image_packs")}
      onClose={onClose}
    >
      <p className="packs__intro">{t("image_packs.intro")}</p>
      <div className="packs__lanes">
        {platformIds.map((pId) => (
          <OnlyLoadsWhenShown height={120} key={pId}>
            <PackLane platformId={pId}>
              <PackOption
                label={t("image_packs.current")}
                selected={selections[pId] === undefined}
                onSelect={() =>
                  setSelections((s) => ({ ...s, [pId]: undefined }))
                }
              >
                <Suspense
                  fallback={<div className="image-packs__placeholder" />}
                >
                  <PlatformImage platformId={pId} />
                </Suspense>
              </PackOption>
              {imagePackSorted.map((pack) => (
                <Suspense
                  key={`${pId}-${pack.owner}-${pack.repository}-${pack.variant}`}
                >
                  <PackImageOption
                    {...pack}
                    platformId={pId}
                    onSelect={() =>
                      setSelections((s) => ({ ...s, [pId]: pack }))
                    }
                    selected={
                      JSON.stringify(selections[pId]) === JSON.stringify(pack)
                    }
                  />
                </Suspense>
              ))}
            </PackLane>
          </OnlyLoadsWhenShown>
        ))}
      </div>

      <div className="modal__actions">
        <Button theme="tertiary" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button
          theme="primary"
          disabled={changeCount === 0}
          onClick={applyChanges}
        >
          {t("image_packs.apply_changes", { count: changeCount })}
        </Button>
      </div>
    </Modal>
  )
}

type PackImageOptionProps = ImagePack & {
  platformId: PlatformId
  onSelect: () => void
  selected: boolean
}

/** A pack's image for the platform; nothing if the pack has none. */
const PackImageOption = ({
  platformId,
  onSelect,
  selected,
  ...pack
}: PackImageOptionProps) => {
  const imagePackImage = useAtomValue(
    ImagePackImageSelectorFamily({ ...pack, platformId })
  )
  if (!imagePackImage) return null

  return (
    <PackOption label={packLabel(pack)} selected={selected} onSelect={onSelect}>
      <img src={imagePackImage.imageSrc} alt="" />
    </PackOption>
  )
}

/** Opens right away with a loader while its data loads. */
export const ImagePacks = (props: ImagePacksProps) => {
  const { t } = useTranslation("platforms")
  return (
    <ModalSuspense
      className="image-packs"
      title={t("controls.image_packs")}
      onClose={props.onClose}
    >
      <ImagePacksContent {...props} />
    </ModalSuspense>
  )
}
