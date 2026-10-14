import { useTranslation } from "react-i18next"
import { useMemo, useState } from "react"
import { useInstallCore } from "../../../../hooks/useInstallCore"
import { InventoryItem } from "../../../../types"
import Button from "../../../ui/Button"
import Select from "../../../ui/Select"

type InstallOlderVersionProps = {
  coreName: string
  inventoryItem: InventoryItem
}

/** Installs any version from the inventory, e.g. to go back after an update. */
export const InstallOlderVersion = ({
  coreName,
  inventoryItem,
}: InstallOlderVersionProps) => {
  const { t } = useTranslation("core_info")

  const priorVersions = useMemo(
    () =>
      inventoryItem.releases.map(
        ({
          download_url,
          core: {
            metadata: { version, date_release },
          },
        }) => ({ version, date_release, download_url })
      ),
    [inventoryItem]
  )

  const [currentDownloadURL, setDownloadURL] = useState<string>(
    priorVersions[0]?.download_url ?? ""
  )

  const { installCore } = useInstallCore()

  if (priorVersions.length === 0) return null

  return (
    <section className="core-info__other-version">
      <h3 className="detail-page__section-title">{t("previous_version")}</h3>
      <p className="detail-page__hint">{t("previous_version_hint")}</p>
      <div className="core-info__other-version-row">
        <Select
          label={t("version")}
          value={currentDownloadURL}
          onChange={setDownloadURL}
          options={priorVersions.map(
            ({ version, date_release, download_url }) => ({
              value: download_url,
              label: date_release ? `${version} (${date_release})` : version,
            })
          )}
        />
        <Button
          icon="download"
          onClick={() => installCore(coreName, currentDownloadURL)}
        >
          {t("controls.install_version")}
        </Button>
      </div>
    </section>
  )
}
