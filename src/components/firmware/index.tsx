import { useRecoilValue } from "recoil"
import {
  FirmwareDetailsSelectorFamily,
  currentFirmwareVersionSelector,
  downloadedFirmwareSelector,
  latestFirmwareSelector,
  previousFirmwareListSelector,
} from "../../recoil/firmware/selectors"
import "./index.css"
import { FirmwareReleaseNotes } from "./releaseNotes"
import { Suspense, useCallback, useState } from "react"
import { Loader } from "../loader"
import { invokeDeleteFiles, invokeDownloadFirmware } from "../../utils/invokes"
import { useTranslation } from "react-i18next"

export const Firmware = () => {
  const currentFirmware = useRecoilValue(currentFirmwareVersionSelector)
  const latestFirmware = useRecoilValue(latestFirmwareSelector)
  const firmwares = useRecoilValue(previousFirmwareListSelector)
  const downloadedFirmware = useRecoilValue(downloadedFirmwareSelector)
  const [selectedFirmware, setSelectedFirmware] = useState(
    latestFirmware.version
  )
  const [isDownloading, setIsDownloading] = useState(false)
  const { t } = useTranslation("firmware")

  return (
    <div className="firmware">
      <div className="firmware__current">
        {t("current", { version: currentFirmware.version })}
      </div>

      <FirmwareDownloaded downloading={isDownloading} />

      <div className="firmware__selector">
        <select
          className="firmware__select"
          value={selectedFirmware}
          onChange={({ target }) => setSelectedFirmware(target.value)}
        >
          <option value={latestFirmware.version}>
            {t("options.latest", { version: latestFirmware.version })}
          </option>
          <optgroup label={t("options.previous_versions")}>
            {firmwares.map((firmware) => (
              <option value={firmware.version} key={firmware.version}>
                {t("options.older", {
                  version: firmware.version,
                  date: firmware.publishedAt,
                })}
              </option>
            ))}
          </optgroup>
        </select>
        {!downloadedFirmware && (
          <Suspense>
            <DownloadButton
              key={selectedFirmware}
              version={selectedFirmware}
              onDownloadStart={() => setIsDownloading(true)}
              onDownloadEnd={() => setIsDownloading(false)}
            />
          </Suspense>
        )}
      </div>

      <div className="firmware__release-notes">
        <Suspense fallback={<Loader />}>
          <FirmwareReleaseNotes
            version={selectedFirmware}
            key={selectedFirmware}
          />
        </Suspense>
      </div>
    </div>
  )
}

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

  const firmwareDetails = useRecoilValue(
    FirmwareDetailsSelectorFamily({ version })
  )

  const onDownload = useCallback(async () => {
    if (!firmwareDetails.download_url) return

    onDownloadStart()
    const _result = await invokeDownloadFirmware(
      firmwareDetails.download_url,
      firmwareDetails.file_name,
      firmwareDetails.md5
    )

    onDownloadEnd()
  }, [
    firmwareDetails.download_url,
    firmwareDetails.file_name,
    firmwareDetails.md5,
    onDownloadEnd,
    onDownloadStart,
  ])

  if (!firmwareDetails.download_url) return null
  return <button onClick={onDownload}>{t("load_firmware")}</button>
}

type FirmwareDownloadedProps = {
  downloading: boolean
}

const FirmwareDownloaded = ({ downloading }: FirmwareDownloadedProps) => {
  const downloadedFirmware = useRecoilValue(downloadedFirmwareSelector)
  const { t } = useTranslation("firmware")

  const onRemove = useCallback(async () => {
    if (downloadedFirmware) {
      await invokeDeleteFiles([downloadedFirmware])
    }
  }, [downloadedFirmware])

  if (!downloadedFirmware) {
    return (
      <div className="firmware__downloaded">
        {downloading ? t("downloading_firmware") : t("no_firmware_loaded")}
      </div>
    )
  }

  return (
    <div className="firmware__downloaded">
      <strong>{t("loaded_firmware", { version: downloadedFirmware })}</strong>
      <button onClick={onRemove}>{t("remove_button")}</button>
    </div>
  )
}
