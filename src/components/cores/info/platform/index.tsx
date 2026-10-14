import { ReactNode, useMemo } from "react"
import {
  PlatformExistsSelectorFamily,
  PlatformInfoSelectorFamily,
} from "../../../../jotai/platforms/selectors"
import { CorePlatformSelectorFamily } from "../../../../jotai/inventory/selectors"
import { currentViewAtom } from "../../../../jotai/view/atoms"
import { PlatformId, PlatformInfoJSON } from "../../../../types"
import { Link } from "../../../link"
import { InventoryPlatformImage, PlatformImage } from "../../platformImage"
import { useTranslation } from "react-i18next"
import Icon from "../../../ui/Icon"

import "./index.css"
import { useAtomValue, useSetAtom } from "jotai"

const HARD_TO_FIND_THINGS = [
  "Asteroids",
  "Genesis",
  "Dominos",
  "Green Beret",
  "Lynx",
]

type Platform = PlatformInfoJSON["platform"]

type CorePlatformInfoProps = {
  platformId: PlatformId
  /** Shows the platform's image, e.g. when a core has several platforms. */
  showImage?: boolean
}

/**
 * A platform the core runs, from the SD card's platform files if they're
 * there, otherwise from the inventory.
 */
export const CorePlatformInfo = ({
  platformId,
  showImage = false,
}: CorePlatformInfoProps) => {
  const fileExists = useAtomValue(PlatformExistsSelectorFamily(platformId))

  if (fileExists)
    return <SDPlatformInfo platformId={platformId} showImage={showImage} />
  return <InventoryPlatformInfo platformId={platformId} showImage={showImage} />
}

const SDPlatformInfo = ({ platformId, showImage }: CorePlatformInfoProps) => {
  const { platform } = useAtomValue(PlatformInfoSelectorFamily(platformId))
  const setViewAndSubview = useSetAtom(currentViewAtom)

  return (
    <PlatformCard
      platform={platform}
      image={
        showImage && (
          <PlatformImage
            className="cores__platform-info-image"
            platformId={platformId}
            label={platform.name}
          />
        )
      }
      onOpen={() =>
        setViewAndSubview({ view: "Platforms", selected: platformId })
      }
    />
  )
}

const InventoryPlatformInfo = ({
  platformId,
  showImage,
}: CorePlatformInfoProps) => {
  const platform = useAtomValue(CorePlatformSelectorFamily(platformId))

  if (!platform) {
    return (
      <div className="cores__platform-info cores__platform-info--non-existent">
        {platformId}
      </div>
    )
  }

  return (
    <PlatformCard
      platform={platform}
      image={
        showImage && (
          <InventoryPlatformImage
            className="cores__platform-info-image"
            platformId={platformId}
            label={platform.name}
          />
        )
      }
    />
  )
}

const PlatformCard = ({
  platform,
  image,
  onOpen,
}: {
  platform: Platform
  image?: ReactNode
  /** Opens the platform's page; only for platforms on the SD card. */
  onOpen?: () => void
}) => {
  const { t } = useTranslation("core_info")

  const wikiLink = useMemo(() => {
    const searchTerm = HARD_TO_FIND_THINGS.includes(platform.name)
      ? `${platform.manufacturer} ${platform.name}`
      : platform.name

    return `https://en.wikipedia.org/wiki/Special:Search?go=Go&search=${window.encodeURIComponent(
      searchTerm
    )}`
  }, [platform])

  return (
    <div className="cores__platform-info">
      {image}
      <div className="cores__platform-info-text">
        {platform.category && (
          <span className="cores__platform-info-category">
            {platform.category}
          </span>
        )}
        <PlatformName name={platform.name} onOpen={onOpen} />
        <span className="cores__platform-info-maker">
          {[platform.manufacturer, platform.year].join(", ")}
        </span>
      </div>
      <span className="cores__platform-info-links">
        <Link href={wikiLink}>{t("platform.wikipedia")}</Link>
      </span>
    </div>
  )
}

/**
 * One line about the core's main platform, e.g. "Nintendo Game Boy, 1989",
 * for the page heading.
 */
export const CorePlatformLine = ({
  platformId,
}: {
  platformId: PlatformId
}) => {
  const fileExists = useAtomValue(PlatformExistsSelectorFamily(platformId))

  if (fileExists) return <SDPlatformLine platformId={platformId} />
  return <InventoryPlatformLine platformId={platformId} />
}

const SDPlatformLine = ({ platformId }: { platformId: PlatformId }) => {
  const { platform } = useAtomValue(PlatformInfoSelectorFamily(platformId))
  const setViewAndSubview = useSetAtom(currentViewAtom)
  return (
    <PlatformLineText
      platform={platform}
      onOpen={() =>
        setViewAndSubview({ view: "Platforms", selected: platformId })
      }
    />
  )
}

const InventoryPlatformLine = ({ platformId }: { platformId: PlatformId }) => {
  const platform = useAtomValue(CorePlatformSelectorFamily(platformId))
  if (!platform) return null
  return <PlatformLineText platform={platform} />
}

const PlatformLineText = ({
  platform,
  onOpen,
}: {
  platform: Platform
  onOpen?: () => void
}) => (
  <span className="cores__platform-line">
    <PlatformName
      name={`${platform.manufacturer} ${platform.name}`}
      onOpen={onOpen}
    />
    <span className="cores__platform-year">{platform.year}</span>
  </span>
)

/** The platform's name; a link to its page when it's on the SD card. */
const PlatformName = ({
  name,
  onOpen,
}: {
  name: string
  onOpen?: () => void
}) => {
  const { t } = useTranslation("core_info")
  if (!onOpen)
    return <strong className="cores__platform-info-name">{name}</strong>
  return (
    <button
      type="button"
      className="cores__platform-info-name cores__platform-link"
      title={t("platform.open")}
      onClick={onOpen}
    >
      {name}
      <Icon icon="chevron-right" size="text" />
    </button>
  )
}

/** The main platform's name, e.g. for the header bar. */
export const CorePlatformName = ({
  platformId,
}: {
  platformId: PlatformId
}) => {
  const fileExists = useAtomValue(PlatformExistsSelectorFamily(platformId))
  const inventoryPlatform = useAtomValue(CorePlatformSelectorFamily(platformId))

  if (fileExists) return <SDPlatformName platformId={platformId} />
  return <>{inventoryPlatform?.name ?? platformId}</>
}

const SDPlatformName = ({ platformId }: { platformId: PlatformId }) => {
  const { platform } = useAtomValue(PlatformInfoSelectorFamily(platformId))
  return <>{platform.name}</>
}
