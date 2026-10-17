import { CSSProperties, ReactNode, useState } from "react"
import {
  PlatformImageExistsSelectorFamily,
  PlatformImageSelectorFamily,
} from "../../jotai/platforms/selectors"
import { PlatformInventoryImageSelectorFamily } from "../../jotai/inventory/selectors"
import { PlatformId } from "../../types"
import { useAtomValue } from "jotai"
import clsx from "clsx"

import "./platformImage.css"

type PlatformImageProps = {
  platformId: PlatformId
  className?: string
  style?: CSSProperties
  /** Shown on the placeholder when there's no image, e.g. the core's name. */
  label?: ReactNode
}

/** The platform's image from the SD card, or a placeholder without one. */
export const PlatformImage = ({
  platformId,
  className,
  style,
  label,
}: PlatformImageProps) => {
  const exists = useAtomValue(PlatformImageExistsSelectorFamily(platformId))

  if (!exists)
    return (
      <PlatformImagePlaceholder
        className={className}
        style={style}
        label={label}
      />
    )
  return (
    <SDPlatformImage
      platformId={platformId}
      className={className}
      style={style}
    />
  )
}

const SDPlatformImage = ({
  platformId,
  className,
  style,
}: Omit<PlatformImageProps, "label">) => {
  const imageSrc = useAtomValue(PlatformImageSelectorFamily(platformId))
  return (
    <img
      className={className}
      src={imageSrc}
      style={style}
      width="521"
      height="165"
      alt=""
    />
  )
}

/**
 * The platform's image from the openFPGA library, for cores that aren't
 * installed; a placeholder if it fails to load.
 */
export const InventoryPlatformImage = ({
  platformId,
  className,
  style,
  label,
}: Omit<PlatformImageProps, "platformId"> & {
  platformId: PlatformId | undefined
}) => {
  const imageSrc = useAtomValue(
    PlatformInventoryImageSelectorFamily(platformId)
  )
  const [failedSrc, setFailedSrc] = useState<string>()

  if (!imageSrc || failedSrc === imageSrc)
    return (
      <PlatformImagePlaceholder
        className={className}
        style={style}
        label={label}
      />
    )
  return (
    <img
      className={className}
      src={imageSrc}
      style={style}
      width="521"
      height="165"
      alt=""
      onError={() => setFailedSrc(imageSrc)}
    />
  )
}

/** Same size as a platform image, in the default surface colour. */
const PlatformImagePlaceholder = ({
  className,
  style,
  label,
}: Omit<PlatformImageProps, "platformId">) => (
  <div
    className={clsx("platform-image-placeholder", className)}
    style={style}
    aria-hidden
  >
    {label && (
      <span className="platform-image-placeholder__label">{label}</span>
    )}
  </div>
)
