import { useMemo } from "react"
import { useRecoilValue } from "recoil"
import { useInstallCore } from "../../../hooks/useInstallCore"
import { useInventoryItem } from "../../../hooks/useInventoryItem"
import { DownloadURLSelectorFamily } from "../../../recoil/inventory/selectors"
import { Controls } from "../../controls"
import { ErrorBoundary } from "../../errorBoundary"
import { Link } from "../../link"
import { Releases } from "./releases"
import { SponsorLinks } from "./sponsorLinks"
import { useTranslation } from "react-i18next"

type NotInstalledCoreInfoProps = {
  onBack: () => void
  coreName: string
}

export const NotInstalledCoreInfo = ({
  coreName,
  onBack,
}: NotInstalledCoreInfoProps) => {
  const inventoryItem = useInventoryItem(coreName)
  const { t } = useTranslation("core_info")

  const url = useMemo(() => {
    if (inventoryItem?.repository.platform !== "github") return null
    return `https://github.com/${inventoryItem.repository.owner}/${inventoryItem.repository.name}`
  }, [inventoryItem])

  const download_url = useRecoilValue(DownloadURLSelectorFamily(coreName))
  const { installCore } = useInstallCore()

  return (
    <div className="core-info">
      <Controls
        controls={[
          {
            type: "back-button",
            text: t("controls.back"),
            onClick: onBack,
          },
          download_url && {
            type: "button",
            text: t("controls.install"),
            onClick: () => {
              installCore(coreName, download_url)
            },
          },
        ]}
      />

      {!inventoryItem && <div>{t("not_in_inventory", { coreName })}</div>}

      {inventoryItem && (
        <>
          <h3 className="core-info__title">{inventoryItem.platform_id}</h3>
          <div className="core-info__info">
            <div className="core-info__info-grid">
              <div className="core-info__info-row">
                {inventoryItem.identifier}
              </div>

              {url && (
                <div className="core-info__info-row">
                  <strong>
                    {t("url")}
                    {":"}
                  </strong>
                  <Link href={url}>{url}</Link>
                </div>
              )}

              {inventoryItem?.sponsor && (
                <div className="core-info__info-row core-info__info-row--right">
                  <strong>
                    {t("sponsor")}
                    {":"}
                  </strong>
                  <ErrorBoundary>
                    <SponsorLinks links={inventoryItem.sponsor} />
                  </ErrorBoundary>
                </div>
              )}

              <div className="core-info__info-row">
                <strong>
                  {t("version")}
                  {":"}
                </strong>
                {inventoryItem.version}
              </div>

              <div className="core-info__info-row">
                <strong>
                  {t("release_date")}
                  {":"}
                </strong>
                {inventoryItem.release_date}
              </div>
            </div>
            {inventoryItem.repository.platform === "github" && (
              <Releases inventoryItem={inventoryItem} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
