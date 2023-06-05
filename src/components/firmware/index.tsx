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
import { useInvalidateFileSystem } from "../../hooks/invalidation"

export const Firmware = () => {
  const currentFirmware = useRecoilValue(currentFirmwareVersionSelector)
  const latestFirmware = useRecoilValue(latestFirmwareSelector)
  const firmwares = useRecoilValue(previousFirmwareListSelector)
  const downloadedFirmware = useRecoilValue(downloadedFirmwareSelector)
  const [selectedFirmware, setSelectedFirmware] = useState(
    latestFirmware.version
  )
  const [isDownloading, setIsDownloading] = useState(false)

  return (
    <div className="firmware">
      <div className="firmware__current">{`Current Firmware: v${currentFirmware.version}`}</div>

      <FirmwareDownloaded downloading={isDownloading} />

      <div className="firmware__selector">
        <select
          className="firmware__select"
          value={selectedFirmware}
          onChange={({ target }) => setSelectedFirmware(target.value)}
        >
          <option
            value={latestFirmware.version}
          >{`v${latestFirmware.version} (latest)`}</option>
          <optgroup label="Previous Versions">
            {firmwares.map((firmware) => (
              <option value={firmware.version} key={firmware.version}>{`v${
                firmware.version
              } (${firmware.publishedAt.toLocaleDateString()})`}</option>
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
  const invalidateFS = useInvalidateFileSystem()

  const firmwareDetails = useRecoilValue(
    FirmwareDetailsSelectorFamily({ version })
  )

  const onDownload = useCallback(async () => {
    if (!firmwareDetails.download_url) return

    onDownloadStart()
    const result = await invokeDownloadFirmware(
      firmwareDetails.download_url,
      firmwareDetails.file_name,
      firmwareDetails.md5
    )

    invalidateFS()
    onDownloadEnd()
  }, [firmwareDetails])

  if (!firmwareDetails.download_url) return null
  return <button onClick={onDownload}>Load on to SD Card</button>
}

type FirmwareDownloadedProps = {
  downloading: boolean
}

const FirmwareDownloaded = ({ downloading }: FirmwareDownloadedProps) => {
  const downloadedFirmware = useRecoilValue(downloadedFirmwareSelector)
  const invalidateFS = useInvalidateFileSystem()

  const onRemove = useCallback(async () => {
    if (downloadedFirmware) {
      await invokeDeleteFiles([downloadedFirmware])
      invalidateFS()
    }
  }, [downloadedFirmware])

  if (!downloadedFirmware) {
    return (
      <div className="firmware__downloaded">
        {downloading
          ? "Downloading Firmware..."
          : "No firmware file on the SD card waiting to be installed"}
      </div>
    )
  }

  return (
    <div className="firmware__downloaded">
      <div>
        <strong>{`Firmware ${downloadedFirmware} is on the SD card`}</strong>
        <div>{"insert & turn the Pocket on to install"}</div>
      </div>

      <button onClick={onRemove}>Remove</button>
    </div>
  )
}
