import { ReactNode, useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"
import { useAtomValue, useSetAtom } from "jotai"

import { currentFirmwareVersionSelector } from "../../../jotai/firmware/selectors"
import { CoreInfoTxtSelectorFamily } from "../../../jotai/cores/selectors"
import { currentViewAtom } from "../../../jotai/view/atoms"
import { CoreInfoJSON } from "../../../types"
import { Link } from "../../link"
import Icon, { IconOptions } from "../../ui/Icon"
import Tag, { TagList } from "../../ui/Tag"
import { CORE_FEATURES, getCoreFeatures } from "../features"
import { DetailSection } from "../../shared/detailPage"

/** The author's pixel icon and name. */
export const CoreAuthor = ({
  name,
  imageSrc,
}: {
  name: string
  imageSrc: string
}) => (
  <span className="core-info__author">
    <img className="core-info__author-image" src={imageSrc} alt="" />
    {name}
  </span>
)

/** The features the core supports, as tags; nothing if it has none. */
export const CoreFeatureTags = ({
  coreName,
  framework,
}: {
  coreName: string
  framework: CoreInfoJSON["core"]["framework"] | undefined
}) => {
  const { t } = useTranslation("core_info")
  const supported = useMemo(() => {
    const features = getCoreFeatures(coreName, framework)
    return CORE_FEATURES.filter((feature) => features[feature])
  }, [coreName, framework])

  if (supported.length === 0) return null
  return (
    <DetailSection title={t("supports")}>
      <TagList>
        {supported.map((feature) =>
          feature === "analogizer" ? (
            <Tag key={feature} theme="analogizer" icon="analogizer">
              {t(`supports_items.${feature}`)}
            </Tag>
          ) : (
            <Tag key={feature} icon="check">
              {t(`supports_items.${feature}`)}
            </Tag>
          )
        )}
      </TagList>
      {supported.includes("analogizer") && (
        <p className="detail-page__hint">
          <Trans t={t} i18nKey={"analogizer"}>
            {"_"}
            <Link href={"https://analogizer-fpga.com/en"}>{"_"}</Link>
          </Trans>
        </p>
      )}
    </DetailSection>
  )
}

/** A full-width message above the tabs, e.g. a replaced core. */
export const CoreNotice = ({
  theme,
  icon,
  children,
  onClick,
}: {
  theme: "danger" | "highlight" | "neutral"
  icon?: IconOptions
  children: ReactNode
  /** Makes the whole notice a button, e.g. to open the replacement. */
  onClick?: () => void
}) => {
  const className = `core-info__notice core-info__notice--${theme}`
  const content = (
    <>
      {icon && <Icon icon={icon} />}
      <div className="core-info__notice-text">{children}</div>
      {onClick && <Icon icon="chevron-right" />}
    </>
  )

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    )
  }
  return <div className={className}>{content}</div>
}

/** Shown when the Pocket's firmware is older than the core needs. */
export const FirmwareWarning = ({
  versionRequired,
}: {
  versionRequired: string | undefined
}) => {
  const currentFirmware = useAtomValue(currentFirmwareVersionSelector)
  const setViewAndSubview = useSetAtom(currentViewAtom)
  const { t } = useTranslation("core_info")

  const firmwareTooLow = useMemo(() => {
    if (!versionRequired) return false
    const [coreMajor, coreMinor] = versionRequired
      .split(".")
      .map((v) => parseInt(v))
    const [pocketMajor, pocketMinor] = currentFirmware.version
      .split(".")
      .map((v) => parseInt(v))

    if (pocketMajor > coreMajor) return false
    if (pocketMajor === coreMajor && pocketMinor >= coreMinor) return false
    return true
  }, [versionRequired, currentFirmware.version])

  if (!firmwareTooLow) return null
  return (
    <CoreNotice
      theme="danger"
      icon="warning-diamond"
      onClick={() => setViewAndSubview({ view: "Firmware", selected: null })}
    >
      {t("firmware_too_low", {
        core_firmware: versionRequired,
        pocket_firmware: currentFirmware.version,
      })}
    </CoreNotice>
  )
}

/** The core's info.txt, shown as is; nothing if the core has none. */
export const InfoTxt = ({ coreName }: { coreName: string }) => {
  const infoTxt = useAtomValue(CoreInfoTxtSelectorFamily(coreName))
  const { t } = useTranslation("core_info")

  if (!infoTxt.trim()) return null
  return (
    <DetailSection title={t("info_txt_title")}>
      <div className="core-info__info-txt">{infoTxt}</div>
    </DetailSection>
  )
}
