import { Suspense, useCallback, useMemo } from "react"

import { useInstallCore } from "../../../hooks/useInstallCore"
import { useInventoryItem } from "../../../hooks/useInventoryItem"
import {
  DownloadURLSelectorFamily,
  PlatformInventoryImageSelectorFamily,
} from "../../../recoil/inventory/selectors"
import { Controls } from "../../controls"
import { ErrorBoundary } from "../../errorBoundary"
import { Link } from "../../link"
import { Releases } from "./releases"
import { SponsorLinks } from "./sponsorLinks"
import { Trans, useTranslation } from "react-i18next"
import { KeyIcon } from "../icons/keyIcon"
import { ControlsBackButton } from "../../controls/inputs/backButton"
import { ControlsButton } from "../../controls/inputs/button"
import { AnalogizerIcon } from "../icons/AnalogizerIcon"
import { DownloadCount } from "./downloadCounts"
import { PocketSyncConfigSelector } from "../../../recoil/config/selectors"
import { useUpdateConfig } from "../../settings/hooks/useUpdateConfig"
import { confirm } from "@tauri-apps/plugin-dialog"
import { InstallOlderVersion } from "./installOlderVersion"
import { useAtomValue } from "jotai"
import { useAtomCallback } from "jotai/utils"

type NotInstalledCoreInfoProps = {
  onBack: () => void
  coreName: string
  withoutControls?: boolean
  withoutTitle?: boolean
}

export const NotInstalledCoreInfo = ({
  coreName,
  onBack,
  withoutControls = false,
  withoutTitle = false,
}: NotInstalledCoreInfoProps) => {
  const inventoryItem = useInventoryItem(coreName)
  const { t } = useTranslation("core_info")

  const url = useMemo(() => {
    if (inventoryItem?.repository.platform !== "github") return null
    return `https://github.com/${inventoryItem.repository.owner}/${inventoryItem.repository.name}`
  }, [inventoryItem])

  const download_url = useAtomValue(DownloadURLSelectorFamily(coreName))

  const latestRelease = inventoryItem?.releases[0]
  const platform_id = latestRelease?.core.metadata.platform_ids[0]
  const requires_license = latestRelease?.updaters?.license

  const version = latestRelease?.core.metadata.version
  const date_release = latestRelease?.core.metadata.date_release
  const funding = inventoryItem?.repository.funding

  const imageUrl = useAtomValue(
    PlatformInventoryImageSelectorFamily(platform_id)
  )
  const { installCore } = useInstallCore()

  return (
    <div className="core-info">
      {!withoutControls && (
        <Controls>
          <ControlsBackButton onClick={onBack}>
            {t("controls.back")}
          </ControlsBackButton>
          <HideCoreButton onBack={onBack} coreName={coreName} />
          {download_url && (
            <ControlsButton
              onClick={() => {
                installCore(coreName, download_url)
              }}
            >
              {t("controls.install")}
            </ControlsButton>
          )}
        </Controls>
      )}
      {!inventoryItem && <div>{t("not_in_inventory", { coreName })}</div>}
      {inventoryItem && (
        <>
          {!withoutTitle && <h3 className="core-info__title">{platform_id}</h3>}
          <img
            className="core-info__image"
            src={imageUrl}
            height="165"
            width="521"
          />

          {requires_license && (
            <>
              <div className="core-info__requires-license">
                <KeyIcon />
                {t("requires_license.all")}
              </div>
              {inventoryItem.id.startsWith("jotego") && (
                <div className="core-info__requires-license">
                  {t("requires_license.jotego")}
                </div>
              )}
            </>
          )}

          {coreName.endsWith("_Analogizer") && (
            <div className="core-info__analogizer">
              <AnalogizerIcon />
              <div>
                <Trans t={t} i18nKey={"analogizer"}>
                  {"_"}
                  <Link href={"https://analogizer-fpga.com/en"}>{"_"}</Link>
                </Trans>
              </div>
            </div>
          )}

          <div className="core-info__info">
            <div className="core-info__info-grid">
              <div className="core-info__info-row">{inventoryItem.id}</div>

              {url && (
                <div className="core-info__info-row">
                  <strong>
                    {t("url")}
                    {":"}
                  </strong>
                  <Link href={url}>{url}</Link>
                </div>
              )}

              <Suspense>
                <div className="core-info__info-row core-info__info-row--right core-info__info-row--hide-if-null">
                  <strong>
                    {t("download_count")}
                    {":"}
                  </strong>
                  <DownloadCount coreName={coreName} />
                </div>
              </Suspense>

              <div className="core-info__info-row">
                <strong>
                  {t("version")}
                  {":"}
                </strong>
                {version}
              </div>

              {funding && (
                <div className="core-info__info-row core-info__info-row--right">
                  <strong>
                    {t("sponsor")}
                    {":"}
                  </strong>
                  <ErrorBoundary>
                    <SponsorLinks links={funding} />
                  </ErrorBoundary>
                </div>
              )}

              <div className="core-info__info-row">
                <strong>
                  {t("release_date")}
                  {":"}
                </strong>
                {date_release}
              </div>
            </div>
            {inventoryItem && (
              <div className="core-info__info-row">
                <InstallOlderVersion
                  coreName={coreName}
                  inventoryItem={inventoryItem}
                />
              </div>
            )}
            {inventoryItem.repository.platform === "github" && (
              <Releases inventoryItem={inventoryItem} />
            )}
          </div>
        </>
      )}
    </div>
  )
}

type HideCoreButtonProps = {
  coreName: string
  onBack: () => void
}

const HideCoreButton = ({ coreName, onBack }: HideCoreButtonProps) => {
  const updateConfig = useUpdateConfig()
  const { t } = useTranslation("core_info")

  const onClick = useAtomCallback(
    useCallback(async (get, _set) => {
      const config = await get(PocketSyncConfigSelector)
      const currentlyHidden = config.hidden_cores ?? []

      if (currentlyHidden.length === 0) {
        const allow = await confirm(t("hide_core_confirm"))
        if (!allow) return
      }

      await updateConfig("hidden_cores", [...currentlyHidden, coreName])

      onBack()
    }, [])
  )

  return (
    <ControlsButton onClick={onClick}>{t("controls.hide_core")}</ControlsButton>
  )
}
