import {
  FirmwareDetailsSelectorFamily,
  currentFirmwareVersionSelector,
  downloadedFirmwareSelector,
  latestFirmwareSelector,
} from "../../jotai/firmware/selectors"
import { allFirmwaresAtom } from "../../jotai/firmware/atoms"
import { FirmwareListItem } from "../../types"
import Accordion, { AccordionItem } from "../ui/Accordion"
import Button from "../ui/Button"
import Icon from "../ui/Icon"
import Select from "../ui/Select"
import Skeleton from "../ui/Skeleton"
import Tag from "../ui/Tag"
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

        <Accordion
          type="single"
          collapsible
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
        </Accordion>
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
    <AccordionItem
      value={firmware.version}
      id={`firmware-${firmware.version}`}
      title={`v${firmware.version}`}
      meta={t("published", { date: firmware.publishedAt })}
      aside={
        <>
          {isLatest && <Tag theme="accent">{t("badge_latest")}</Tag>}
          {isInstalled && <Tag>{t("badge_installed")}</Tag>}
        </>
      }
    >
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
    </AccordionItem>
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

  if (downloading) {
    return (
      <div className="firmware__downloaded">
        <div className="firmware__progress">
          <ProgressLoader name="firmware_download" />
          {t("downloading_firmware")}
        </div>
      </div>
    )
  }

  // Nothing waiting: all fine, so it's a quiet line with a check
  if (!downloadedFirmware) {
    return (
      <div className="firmware__downloaded firmware__downloaded--none">
        <Icon icon="check" />
        {t("no_firmware_loaded")}
      </div>
    )
  }

  return (
    <Suspense fallback={<div className="firmware__downloaded" />}>
      <DownloadedFile fileName={downloadedFirmware} />
    </Suspense>
  )
}

/**
 * A firmware file at the top of the SD card: either an update the Pocket
 * installs when it starts, or the installer of the version it already runs
 * (left over), which can go.
 */
const DownloadedFile = ({ fileName }: { fileName: string }) => {
  const currentFirmware = useAtomValue(currentFirmwareVersionSelector)
  const currentDetails = useAtomValue(
    FirmwareDetailsSelectorFamily({ version: currentFirmware.version })
  )
  const { t } = useTranslation("firmware")
  const isInstalledVersion = currentDetails.file_name === fileName

  const onRemove = useCallback(async () => {
    await invokeDeleteFiles([fileName])
  }, [fileName])

  if (isInstalledVersion) {
    return (
      <div className="firmware__downloaded">
        <div className="firmware__downloaded-text">
          <span>
            {t("loaded_current", { version: currentFirmware.version })}
          </span>
          <span className="firmware__downloaded-info">
            {t("loaded_current_info")}
          </span>
        </div>
        <Button theme="tertiary" icon="trash" onClick={onRemove}>
          {t("remove_installer")}
        </Button>
      </div>
    )
  }

  return (
    <div className="firmware__downloaded">
      <div className="firmware__downloaded-text">
        <strong>{t("loaded_firmware", { version: fileName })}</strong>
        <span className="firmware__downloaded-info">
          {t("loaded_firmware_info")}
        </span>
      </div>
      <Button theme="destructive" icon="trash" onClick={onRemove}>
        {t("remove_button")}
      </Button>
    </div>
  )
}
