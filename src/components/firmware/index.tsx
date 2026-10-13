import {
  FirmwareDetailsSelectorFamily,
  currentFirmwareVersionSelector,
  downloadedFirmwareSelector,
  latestFirmwareSelector,
} from "../../jotai/firmware/selectors"
import { allFirmwaresAtom } from "../../jotai/firmware/atoms"
import * as RadixAccordion from "@radix-ui/react-accordion"
import { FirmwareListItem } from "../../types"
import Button from "../ui/Button"
import Icon from "../ui/Icon"
import Select from "../ui/Select"
import Skeleton from "../ui/Skeleton"
import "./index.css"
import { FirmwareReleaseNotes } from "./releaseNotes"
import { Suspense, useCallback, useState, useTransition } from "react"
import { invokeDeleteFiles, invokeDownloadFirmware } from "../../utils/invokes"
import { useTranslation } from "react-i18next"
import { ProgressLoader } from "../loader/progress"
import { message } from "@tauri-apps/plugin-dialog"
import { useAtomValue } from "jotai"

/**
 * Current firmware and SD card status on top; below, every version as its own
 * card that previews its release notes and can be loaded directly. Only the
 * installed version starts unfolded; a select jumps straight to any version.
 */
export const Firmware = () => {
  const currentFirmware = useAtomValue(currentFirmwareVersionSelector)
  const latestFirmware = useAtomValue(latestFirmwareSelector)
  const allFirmwares = useAtomValue(allFirmwaresAtom)
  const [expanded, setExpanded] = useState(currentFirmware.version)
  const [isDownloading, setIsDownloading] = useState(false)
  const { t } = useTranslation("firmware")
  const [_isTransitioning, startTransition] = useTransition()

  const jumpTo = (version: string) => {
    setExpanded(version)
    requestAnimationFrame(() =>
      document
        .getElementById(`firmware-${version}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    )
  }

  return (
    <div className="firmware">
      <section className="firmware__status">
        <div className="firmware__current">
          <span className="firmware__label">{t("current_label")}</span>
          <span className="firmware__current-version">
            {`v${currentFirmware.version}`}
          </span>
        </div>
        <FirmwareDownloaded downloading={isDownloading} />
      </section>

      <section className="firmware__versions">
        <div className="firmware__versions-header">
          <h2 className="firmware__heading">{t("versions_title")}</h2>
          <Select
            label={t("jump_to")}
            value={expanded || latestFirmware.version}
            onChange={jumpTo}
            options={allFirmwares.map((firmware) => ({
              value: firmware.version,
              label: t("options.older", {
                version: firmware.version,
                date: firmware.publishedAt,
              }),
            }))}
          />
        </div>

        <RadixAccordion.Root
          type="single"
          collapsible
          className="firmware__list"
          value={expanded}
          onValueChange={setExpanded}
        >
          {allFirmwares.map((firmware) => (
            <FirmwareItem
              key={firmware.version}
              firmware={firmware}
              isLatest={firmware.version === latestFirmware.version}
              isInstalled={firmware.version === currentFirmware.version}
              isDownloading={isDownloading}
              onDownloadStart={() =>
                startTransition(() => setIsDownloading(true))
              }
              onDownloadEnd={() =>
                startTransition(() => setIsDownloading(false))
              }
            />
          ))}
        </RadixAccordion.Root>
      </section>
    </div>
  )
}

type FirmwareItemProps = {
  firmware: FirmwareListItem
  isLatest: boolean
  isInstalled: boolean
  isDownloading: boolean
  onDownloadStart: () => void
  onDownloadEnd: () => void
}

/** One version: a header row that expands to its release notes. */
const FirmwareItem = ({
  firmware,
  isLatest,
  isInstalled,
  isDownloading,
  onDownloadStart,
  onDownloadEnd,
}: FirmwareItemProps) => {
  const { t } = useTranslation("firmware")
  const downloadedFirmware = useAtomValue(downloadedFirmwareSelector)

  return (
    <RadixAccordion.Item
      value={firmware.version}
      className="firmware__item"
      id={`firmware-${firmware.version}`}
    >
      <RadixAccordion.Header className="firmware__item-header">
        <RadixAccordion.Trigger className="firmware__item-trigger">
          <span className="firmware__item-version">{`v${firmware.version}`}</span>
          <span className="firmware__item-date">
            {t("published", { date: firmware.publishedAt })}
          </span>
          {isLatest && (
            <span className="firmware__badge firmware__badge--latest">
              {t("badge_latest")}
            </span>
          )}
          {isInstalled && (
            <span className="firmware__badge">{t("badge_installed")}</span>
          )}
          <Icon icon="chevron-down" className="firmware__item-chevron" />
        </RadixAccordion.Trigger>
      </RadixAccordion.Header>
      <RadixAccordion.Content className="firmware__item-content">
        {!downloadedFirmware && !isDownloading && (
          <Suspense>
            <DownloadButton
              version={firmware.version}
              onDownloadStart={onDownloadStart}
              onDownloadEnd={onDownloadEnd}
            />
          </Suspense>
        )}
        <Suspense fallback={<ReleaseNotesSkeleton />}>
          <FirmwareReleaseNotes version={firmware.version} />
        </Suspense>
      </RadixAccordion.Content>
    </RadixAccordion.Item>
  )
}

const ReleaseNotesSkeleton = () => (
  <div className="firmware__notes-skeleton">
    <Skeleton width="40%" />
    <Skeleton width="90%" />
    <Skeleton width="75%" />
    <Skeleton width="85%" />
  </div>
)

type DownloadButtonProps = {
  onDownloadStart: () => void
  onDownloadEnd: () => void
  version: string
}

const DownloadButton = ({
  onDownloadStart,
  onDownloadEnd,
  version,
}: DownloadButtonProps) => {
  const { t } = useTranslation("firmware")

  const firmwareDetails = useAtomValue(
    FirmwareDetailsSelectorFamily({ version })
  )

  const onDownload = useCallback(async () => {
    if (!firmwareDetails.download_url) return

    onDownloadStart()
    const verified = await invokeDownloadFirmware(
      firmwareDetails.download_url,
      firmwareDetails.file_name,
      firmwareDetails.md5
    )

    if (!verified) {
      // _hopefully_ this never happens, but if users start seeing it I'll bother translating it
      message(
        "Firmware verification failed\n\nTry again or download manually",
        {
          kind: "error",
        }
      )
    }

    onDownloadEnd()
  }, [
    firmwareDetails.download_url,
    firmwareDetails.file_name,
    firmwareDetails.md5,
    onDownloadEnd,
    onDownloadStart,
  ])

  if (!firmwareDetails.download_url) return null
  return (
    <Button theme="primary" icon="download" onClick={onDownload}>
      {t("load_firmware")}
    </Button>
  )
}

type FirmwareDownloadedProps = {
  downloading: boolean
}

const FirmwareDownloaded = ({ downloading }: FirmwareDownloadedProps) => {
  const downloadedFirmware = useAtomValue(downloadedFirmwareSelector)
  const { t } = useTranslation("firmware")

  const onRemove = useCallback(async () => {
    if (downloadedFirmware) {
      await invokeDeleteFiles([downloadedFirmware])
    }
  }, [downloadedFirmware])

  if (!downloadedFirmware) {
    return (
      <div className="firmware__downloaded">
        {downloading ? (
          <div className="firmware__progress">
            <ProgressLoader name="firmware_download" />
            {t("downloading_firmware")}
          </div>
        ) : (
          t("no_firmware_loaded")
        )}
      </div>
    )
  }

  return (
    <div className="firmware__downloaded">
      <div>
        <strong>{t("loaded_firmware", { version: downloadedFirmware })}</strong>
        <div className="firmware__downloaded-info">
          {t("loaded_firmware_info")}
        </div>
      </div>
      <Button theme="destructive" icon="trash" onClick={onRemove}>
        {t("remove_button")}
      </Button>
    </div>
  )
}
