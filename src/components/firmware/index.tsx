import { useRecoilValue } from "recoil"
import {
  FirmwareReleaseNotesSelectorFamily,
  currentFirmwareVersionSelector,
  downloadedFirmwareSelector,
  latestFirmwareSelector,
  previousFirmwareListSelector,
} from "../../recoil/firmware/selectors"
import { Tip } from "../tip"

import "./index.css"
import { FirmwareReleaseNotes } from "./releaseNotes"
import { Suspense, useCallback, useMemo, useState } from "react"
import { VersionSting } from "../../types"
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

  const selectedFirmwareInfo = useMemo(() => {
    if (latestFirmware.version === selectedFirmware) return latestFirmware
    const foundFirmware = firmwares.find((f) => f.version === selectedFirmware)
    if (!foundFirmware) throw new Error("Selected impossible firmware")
    return foundFirmware
  }, [selectedFirmware])

  const invalidateFS = useInvalidateFileSystem()

  const onDownload = useCallback(async () => {
    setIsDownloading(true)
    const result = await invokeDownloadFirmware(
      selectedFirmwareInfo.url,
      selectedFirmwareInfo.filename,
      selectedFirmwareInfo.md5_hash
    )

    invalidateFS()
    setIsDownloading(false)
  }, [selectedFirmwareInfo])

  return (
    <div className="firmware">
      <div className="firmware__current">{`Current Firmware: v${currentFirmware.version}`}</div>

      <FirmwareDownloaded downloading={isDownloading} />

      <div className="firmware__selector">
        <select
          className="firmware__select"
          value={selectedFirmware}
          onChange={({ target }) =>
            setSelectedFirmware(target.value as VersionSting)
          }
        >
          <option
            value={latestFirmware.version}
          >{`v${latestFirmware.version} (latest)`}</option>
          <optgroup label="Previous Versions">
            {firmwares.map((firmware) => (
              <option
                value={firmware.version}
                key={firmware.version}
              >{`v${firmware.version} (${firmware.publishedAt})`}</option>
            ))}
          </optgroup>
        </select>
        {!downloadedFirmware && (
          <button onClick={onDownload}>Load on to SD Card</button>
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

type FirmwareDownloadedProps = {
  downloading: boolean
}

const FirmwareDownloaded = ({ downloading }: FirmwareDownloadedProps) => {
  const downloadedFirmware = useRecoilValue(downloadedFirmwareSelector)
  const invalidateFS = useInvalidateFileSystem()

  const onRemove = useCallback(async () => {
    if (downloadedFirmware) {
      await invokeDeleteFiles([downloadedFirmware.filename])
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
        <strong>{`Firmware v${downloadedFirmware.version} is on the SD card`}</strong>
        <div>{"insert & turn the Pocket on to install"}</div>
      </div>

      <button onClick={onRemove}>Remove</button>
    </div>
  )
}
