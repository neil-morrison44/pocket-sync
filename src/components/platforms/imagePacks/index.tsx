import { Suspense, useMemo, useState } from "react"
import { useRecoilCallback, useRecoilValue } from "recoil"
import { useInvalidateFileSystem } from "../../../hooks/invalidation"
import { pocketPathAtom } from "../../../recoil/atoms"
import {
  ImagePackImageSelectorFamily,
  imagePackListSelector,
  platformsListSelector,
} from "../../../recoil/platforms/selectors"
import { ImagePack, PlatformId } from "../../../types"
import { invokeSaveFile } from "../../../utils/invokes"
import { PlatformImage } from "../../cores/platformImage"
import { Link } from "../../link"
import { Loader } from "../../loader"
import { Modal } from "../../modal"
import { useTranslation } from "react-i18next"

import "./index.css"
import { PlatformName } from "./platformName"

type ImagePacksProps = {
  onClose: () => void
  singlePlatformId?: PlatformId
}

export const ImagePacks = ({ onClose, singlePlatformId }: ImagePacksProps) => {
  const allPlatformIds = useRecoilValue(platformsListSelector)
  const platformIds = useMemo(() => {
    if (singlePlatformId) return [singlePlatformId]
    return allPlatformIds
  }, [allPlatformIds, singlePlatformId])

  const imagePacks = useRecoilValue(imagePackListSelector)
  const [selections, setSelections] = useState<
    Record<PlatformId, ImagePack | undefined>
  >({})

  const changeCount = Object.values(selections).filter(Boolean).length
  const invalidateFS = useInvalidateFileSystem()
  const { t } = useTranslation("platforms")

  const applyChanges = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const pocketPath = await snapshot.getPromise(pocketPathAtom)
        if (!pocketPath) return
        for (const platformId in selections) {
          const pack = selections[platformId]
          if (!pack) continue
          const image = await snapshot.getPromise(
            ImagePackImageSelectorFamily({ ...pack, platformId })
          )
          if (!image) continue
          await invokeSaveFile(
            `${pocketPath}/Platforms/_images/${platformId}.bin`,
            new Uint8Array(await image.file.arrayBuffer())
          )
        }

        onClose()
        setTimeout(() => invalidateFS(), 100)
      },
    [selections]
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
              <PlatformName platformId={pId} />
              <PlatformImage platformId={pId} className="image-packs__image" />
            </div>
          ))}
        </div>

        {imagePacks.map((pack) => (
          <div
            key={`${pack.owner}-${pack.repository}-${pack.variant}`}
            className="image-packs__column"
          >
            <div className="image-packs__column-name">
              <Link
                href={`https://github.com/${pack.owner}/${pack.repository}`}
              >
                <b>{pack.owner}</b>
                <div title={pack.repository}>{pack.repository}</div>
                {pack.variant && <small>{pack.variant}</small>}
              </Link>
            </div>

            {platformIds.map((pId) => (
              <Suspense
                key={`${pId}-${pack.owner}-${pack.repository}-${pack.variant}`}
                fallback={
                  <div className="image-packs__item image-packs__item--missing">
                    <Loader />
                  </div>
                }
              >
                <PackColumnItem
                  {...pack}
                  platformId={pId}
                  onClick={() => setSelections((s) => ({ ...s, [pId]: pack }))}
                  isSelected={
                    JSON.stringify(selections[pId]) === JSON.stringify(pack)
                  }
                />
              </Suspense>
            ))}
          </div>
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
  const imagePackImage = useRecoilValue(
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
