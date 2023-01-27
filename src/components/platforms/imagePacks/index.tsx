import { useState } from "react"
import { useRecoilCallback, useRecoilValue } from "recoil"
import { useInvalidateFileSystem } from "../../../hooks/invalidation"
import { pocketPathAtom } from "../../../recoil/atoms"
import {
  ImagePackImageSelectorFamily,
  platformsListSelector,
} from "../../../recoil/platforms/selectors"
import { PlatformId } from "../../../types"
import { invokeSaveFile } from "../../../utils/invokes"
import { PlatformImage } from "../../cores/platformImage"
import { Link } from "../../link"
import { Modal } from "../../modal"

import "./index.css"
import { PlatformName } from "./platformName"

type ImagePacksProps = {
  onClose: () => void
}

const HARDCODED_PACKS = [
  {
    owner: "spiritualized1997",
    repository: "openFPGA-Platform-Art-Set",
  },
  {
    owner: "dyreschlock",
    repository: "pocket-platform-images",
    variant: "home",
  },
  {
    owner: "dyreschlock",
    repository: "pocket-platform-images",
    variant: "arcade",
  },
  {
    owner: "terminator2k2",
    repository: "Analogue-Pocket-Core-Art",
  },
  {
    owner: "MegaZXretro",
    repository: "Analogue-Pocket-Custom-Platform-Art",
    variant: "JAPAN",
  },
  {
    owner: "MegaZXretro",
    repository: "Analogue-Pocket-Custom-Platform-Art",
    variant: "PAL-EU",
  },
  {
    owner: "MegaZXretro",
    repository: "Analogue-Pocket-Custom-Platform-Art",
    variant: "USA",
  },
]

export const ImagePacks = ({ onClose }: ImagePacksProps) => {
  const platformIds = useRecoilValue(platformsListSelector)

  const [selections, setSelections] = useState<
    Record<PlatformId, typeof HARDCODED_PACKS[number] | undefined>
  >({})

  const changeCount = Object.values(selections).filter(Boolean).length

  const invalidateFS = useInvalidateFileSystem()

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
        <div
          className="image-packs__column"
          style={{ position: "sticky", left: 0, zIndex: 10000 }}
        >
          <div className="image-packs__column-name">{"Current"}</div>
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

        {HARDCODED_PACKS.map((pack) => (
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
              <PackColumnItem
                key={`${pId}-${pack.owner}-${pack.repository}-${pack.variant}`}
                {...pack}
                platformId={pId}
                onClick={() => setSelections((s) => ({ ...s, [pId]: pack }))}
                isSelected={
                  JSON.stringify(selections[pId]) === JSON.stringify(pack)
                }
              />
            ))}
          </div>
        ))}
      </div>

      <div className="image-packs__buttons">
        <button onClick={applyChanges}>{`Apply ${changeCount} Change${
          changeCount !== 1 ? "s" : ""
        }`}</button>
        <button onClick={onClose}>{"Close"}</button>
      </div>
    </Modal>
  )
}

type PackColumnItemProps = {
  owner: string
  repository: string
  variant?: string
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
