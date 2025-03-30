import { useTranslation } from "react-i18next"
import { Details } from "../../../shared/details"
import { useInventoryItem } from "../../../../hooks/useInventoryItem"
import { useMemo, useState } from "react"
import { useInstallCore } from "../../../../hooks/useInstallCore"

type InstallOlderVersionProps = {
  coreName: string
}

export const InstallOlderVersion = ({ coreName }: InstallOlderVersionProps) => {
  const { t } = useTranslation("core_info")
  const inventoryItem = useInventoryItem(coreName)
  const priorVersions = useMemo(
    () =>
      inventoryItem?.releases.map(
        ({
          download_url,
          core: {
            metadata: { version },
          },
        }) => [version, download_url] as const
      ) ?? [],
    [inventoryItem]
  )

  const [currentDownloadURL, setDownloadURL] = useState<string>(
    priorVersions[0][1]
  )

  const { installCore } = useInstallCore()

  return (
    <Details title={t("previous_version")}>
      <select
        className="core-info__previous-select"
        value={currentDownloadURL}
        onChange={(e) => setDownloadURL(e.target.value)}
      >
        {priorVersions.map(([version, downloadURL]) => (
          <option value={downloadURL}>{version}</option>
        ))}
      </select>
      <button
        className="core-info__previous-install-button"
        onClick={() => installCore(coreName, currentDownloadURL)}
      >
        {t("controls.install")}
      </button>
    </Details>
  )
}
