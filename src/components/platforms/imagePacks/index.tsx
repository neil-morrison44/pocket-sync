import { useRecoilValue } from "recoil"
import {
  ImagePackImageSelectorFamily,
  platformsListSelector,
} from "../../../recoil/platforms/selectors"
import { PlatformId } from "../../../types"
import { PlatformImage } from "../../cores/platformImage"
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
] as const

export const ImagePacks = ({ onClose }: ImagePacksProps) => {
  const platformIds = useRecoilValue(platformsListSelector)

  return (
    <Modal className="image-packs">
      <div className="image-packs__content">
        <div className="image-packs__column">
          <div className="image-packs__column-name">{"Current"}</div>
          {platformIds.map((pId) => (
            <div className="image-packs__item">
              <PlatformName platformId={pId} />
              <PlatformImage platformId={pId} className="image-packs__image" />
            </div>
          ))}
        </div>

        <div className="image-packs__packs">
          {HARDCODED_PACKS.map((pack) => (
            <div className="image-packs__column">
              <div className="image-packs__column-name">{`${pack.owner} - ${pack.repository}`}</div>
              {platformIds.map((pId) => (
                <PackColumnItem {...pack} platformId={pId} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="image-packs__buttons">
        <button>{"Apply"}</button>
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
}

const PackColumnItem = ({
  owner,
  repository,
  variant,
  platformId,
}: PackColumnItemProps) => {
  const imagePackImage = useRecoilValue(
    ImagePackImageSelectorFamily({ owner, repository, variant, platformId })
  )

  if (!imagePackImage) return <div className="image-packs__item"></div>

  return (
    <div className="image-packs__item">
      <PlatformName platformId={platformId} />
      <img src={imagePackImage.imageSrc}></img>
    </div>
  )
}
