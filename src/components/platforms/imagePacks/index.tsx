import { Suspense, useCallback, useMemo, useState } from "react"
import {
  ImagePackImageSelectorFamily,
  imagePackListSelector,
  platformsListSelector,
} from "../../../recoil/platforms/selectors"
import { ImagePack, PlatformId } from "../../../types"
import { PlatformImage } from "../../cores/platformImage"
import { Link } from "../../link"
import { Loader } from "../../loader"
import { Modal } from "../../modal"
import { useTranslation } from "react-i18next"

import "./index.css"
import { PlatformName } from "./platformName"
import { OnlyLoadsWhenShown } from "../../../utils/onlyLoadsWhenShown"
import { invokeSaveMultipleFiles } from "../../../utils/invokes"
import { useAtomValue } from "jotai"
import { loadable, useAtomCallback } from "jotai/utils"

type ImagePacksProps = {
  onClose: () => void
  singlePlatformId?: PlatformId
}

export const ImagePacks = ({ onClose, singlePlatformId }: ImagePacksProps) => {
  const allPlatformIds = useAtomValue(platformsListSelector)
  const platformIds = useMemo(() => {
    if (singlePlatformId) return [singlePlatformId]
    return allPlatformIds
  }, [allPlatformIds, singlePlatformId])

  const imagePacksLoadable = useAtomValue(loadable(imagePackListSelector))

  const imagePacks = useMemo(() => {
    if (imagePacksLoadable.state !== "hasData") return []

    if (singlePlatformId) {
      return imagePacksLoadable.data.filter(({ image_platforms }) =>
        image_platforms.includes(singlePlatformId)
      )
    }

    const sorted = [...imagePacksLoadable.data]
    return sorted.sort(
      (a, b) => b.image_platforms.length - a.image_platforms.length
    )
  }, [imagePacksLoadable])

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
    <Modal className="image-packs">
      <div className="image-packs__content">
        <div className="image-packs__column image-packs__column--current">
          <div className="image-packs__column-name">
            {t("image_packs.current")}
          </div>
          {platformIds.map((pId) => (
            <div
              key={pId}
              className={`image-packs__item ${
                selections[pId] === undefined
                  ? "image-packs__item--selected"
                  : ""
              }`}
              onClick={() => setSelections((s) => ({ ...s, [pId]: undefined }))}
            >
              <OnlyLoadsWhenShown height={103}>
                <Suspense>
                  <PlatformName platformId={pId} />
                  <PlatformImage
                    platformId={pId}
                    className="image-packs__image"
                  />
                </Suspense>
              </OnlyLoadsWhenShown>
            </div>
          ))}
        </div>

        {imagePacks.map((pack) => (
          <Suspense key={`${pack.owner}-${pack.repository}-${pack.variant}`}>
            <div className="image-packs__column">
              <div className="image-packs__column-name">
                <Link
                  href={`https://github.com/${pack.owner}/${pack.repository}`}
                >
                  <b>{pack.owner}</b>
                  <div title={pack.repository}>{pack.repository}</div>
                  <small title={pack.variant}>{pack.variant}</small>
                </Link>
              </div>

              {platformIds.map((pId) => (
                <OnlyLoadsWhenShown
                  key={`${pId}-${pack.owner}-${pack.repository}-${pack.variant}`}
                  height={103}
                >
                  <Suspense
                    fallback={
                      <div className="image-packs__item image-packs__item--missing">
                        <Loader />
                      </div>
                    }
                  >
                    <PackColumnItem
                      {...pack}
                      platformId={pId}
                      onClick={() =>
                        setSelections((s) => ({ ...s, [pId]: pack }))
                      }
                      isSelected={
                        JSON.stringify(selections[pId]) === JSON.stringify(pack)
                      }
                    />
                  </Suspense>
                </OnlyLoadsWhenShown>
              ))}
            </div>
          </Suspense>
        ))}
      </div>

      <div className="image-packs__buttons">
        <button onClick={applyChanges}>
          {t("image_packs.apply_changes", { count: changeCount })}
        </button>
        <button onClick={onClose}>{t("image_packs.close")}</button>
      </div>
    </Modal>
  )
}

type PackColumnItemProps = ImagePack & {
  platformId: PlatformId
  onClick: () => void
  isSelected: boolean
}

const PackColumnItem = ({
  owner,
  repository,
  variant,
  platformId,
  onClick,
  isSelected,
}: PackColumnItemProps) => {
  const imagePackImage = useAtomValue(
    ImagePackImageSelectorFamily({ owner, repository, variant, platformId })
  )

  if (!imagePackImage)
    return <div className="image-packs__item image-packs__item--missing"></div>

  return (
    <div
      className={`image-packs__item ${
        isSelected ? "image-packs__item--selected" : ""
      }`}
      onClick={onClick}
    >
      <PlatformName platformId={platformId} />
      <img src={imagePackImage.imageSrc}></img>
    </div>
  )
}
