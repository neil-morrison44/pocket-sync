import { useRecoilValue, useSetRecoilState } from "recoil"
import {
  CoreInfoSelectorFamily,
  CoreMainPlatformIdSelectorFamily,
} from "../../../recoil/selectors"
import { DownloadURLSelectorFamily } from "../../../recoil/inventory/selectors"
import { Controls } from "../../controls"
import { Link } from "../../link"

import "./index.css"
import { PlatformImage } from "../platformImage"
import { useInventoryItem } from "../../../hooks/useInventoryItem"
import { Releases } from "./releases"
import { Version } from "../version"
import { useUninstallCore } from "../../../hooks/useUninstallCore"
import { useInstallCore } from "../../../hooks/useInstallCore"
import { Suspense, useCallback, useMemo, useState } from "react"
import { CorePlatformInfo } from "./platform"
import { Loader } from "../../loader"
import { SponsorLinks } from "./sponsorLinks"
import { RequiredFiles } from "./requiredFiles"
import { LoadRequiredFiles } from "./loadRequiredFiles"
import { ErrorBoundary } from "../../errorBoundary"
import { AuthorTag } from "../../shared/authorTag"
import { CoreInputs } from "./coreInputs"
import { CoreSettings } from "./coreSettings"
import { RequiredFileInfoSelectorFamilyTwo } from "../../../recoil/requiredFiles/selectors"
import { Trans, useTranslation } from "react-i18next"
import { archiveBumpAtom } from "../../../recoil/archive/atoms"
import { currentViewAtom } from "../../../recoil/view/atoms"
import { useReplacementAvailable } from "../../../hooks/useReplacementAvailable"
import { ControlsBackButton } from "../../controls/inputs/backButton"
import { ControlsButton } from "../../controls/inputs/button"
import { currentFirmwareVersionSelector } from "../../../recoil/firmware/selectors"
import { WarningIcon } from "./requiredFiles/warningIcon"
import { Modal } from "../../modal"
import { DisplayModes } from "./displayModes"
import { SupportsBubble } from "./supportsBubble"
import { Details } from "../../shared/details"
import { CoreInfoTxtSelectorFamily } from "../../../recoil/cores/selectors"
import { invoke } from "@tauri-apps/api"

type CoreInfoProps = {
  coreName: string
  onBack: () => void
}

export const InstalledCoreInfo = ({ coreName, onBack }: CoreInfoProps) => {
  const coreInfo = useRecoilValue(CoreInfoSelectorFamily(coreName))
  const uninstall = useUninstallCore()
  const { installCore } = useInstallCore()
  const inventoryItem = useInventoryItem(coreName)
  const downloadUrl = useRecoilValue(DownloadURLSelectorFamily(coreName))

  const [requiredFilesOpen, setRequiredFilesOpen] = useState(false)
  const setArchiveBump = useSetRecoilState(archiveBumpAtom)
  const [inputsOpen, setInputsOpen] = useState(false)
  const [coreSettingsOpen, setCoreSettingsOpen] = useState(false)
  const { t } = useTranslation("core_info")
  const setViewAndSubview = useSetRecoilState(currentViewAtom)
  const replacementCore = useReplacementAvailable(coreName)

  const goToReplacement = useCallback(() => {
    setViewAndSubview({ view: "Cores", selected: replacementCore })
  }, [replacementCore, setViewAndSubview])

  const mainPlatformId = useRecoilValue(
    CoreMainPlatformIdSelectorFamily(coreName)
  )

  return (
    <div className="core-info">
      <Controls>
        <ControlsBackButton onClick={onBack}>
          {t("controls.back")}
        </ControlsBackButton>
        <ControlsButton onClick={() => uninstall(coreName)}>
          {t("controls.uninstall")}
        </ControlsButton>
        <Suspense>
          <RequiredFilesButton
            coreName={coreName}
            onClick={() => {
              // setArchiveBump((a) => a + 1)
              setRequiredFilesOpen(true)
            }}
          />
        </Suspense>
        {downloadUrl && (
          <ControlsButton onClick={() => installCore(coreName, downloadUrl)}>
            {t("controls.update")}
          </ControlsButton>
        )}
      </Controls>

      {requiredFilesOpen && (
        <Suspense
          fallback={
            <Modal className="load-required-files">
              <Loader />
            </Modal>
          }
        >
          <LoadRequiredFiles
            coreName={coreName}
            onClose={() => setRequiredFilesOpen(false)}
          />
        </Suspense>
      )}

      {inputsOpen && (
        <CoreInputs
          coreName={coreName}
          onClose={() => setInputsOpen(false)}
          platformId={mainPlatformId}
        />
      )}

      {coreSettingsOpen && (
        <CoreSettings
          coreName={coreName}
          onClose={() => setCoreSettingsOpen(false)}
        />
      )}

      <h3 className="core-info__title">{coreInfo.core.metadata.shortname}</h3>
      {replacementCore && (
        <div className="core-info__replaced" onClick={goToReplacement}>
          <Trans t={t} i18nKey={"replaced"} values={{ replacementCore }}>
            {"_"}
            <strong>{"_"}</strong>
          </Trans>
        </div>
      )}

      <PlatformImage className="core-info__image" platformId={mainPlatformId} />

      <FirmwareWarning coreName={coreName} />

      <button
        onClick={async () => {
          console.log("click?")
          const result = await invoke("find_required_files", {
            coreId: coreName,
            includeAlts: true,
            archiveUrl: "https://archive.org/metadata/openFPGA-Files",
          })
          console.log({ result })
        }}
      >
        Core Request
      </button>

      <section className="core-info__info">
        <p>{coreInfo.core.metadata.description}</p>

        <div className="core-info__info-grid">
          <div className="core-info__info-row">
            <strong>
              {t("version")}
              {":"}
            </strong>
            <Version coreName={coreName} />
          </div>

          <div className="core-info__info-row">
            <strong>
              {t("author")}
              {":"}
            </strong>
            <AuthorTag coreName={coreName} />
          </div>

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

          {coreInfo.core.metadata.url && (
            <div className="core-info__info-row">
              <strong>
                {t("url")}
                {":"}
              </strong>
              <Link href={coreInfo.core.metadata.url}>
                {coreInfo.core.metadata.url}
              </Link>
            </div>
          )}

          <Suspense
            fallback={
              <div className="core-info__info-row">
                <strong>
                  {t("required_files")}
                  {":"}
                </strong>
                {t("please_wait")}
              </div>
            }
          >
            <RequiredFiles
              coreName={coreName}
              onClick={() => setRequiredFilesOpen(true)}
            />
          </Suspense>

          {coreInfo.core.metadata.date_release && (
            <div className="core-info__info-row">
              <strong>
                {t("release_date")}
                {":"}
              </strong>

              {coreInfo.core.metadata.date_release}
            </div>
          )}
        </div>

        <div className="core-info__info-row">
          <strong>
            {t("supports")}
            {":"}
          </strong>
          <div className="core-info__supports-bubbles">
            <SupportsBubble supports={coreInfo.core.framework.sleep_supported}>
              {t("supports_items.save_states_and_sleep")}
            </SupportsBubble>

            <SupportsBubble supports={coreInfo.core.framework.dock.supported}>
              {t("supports_items.dock")}
            </SupportsBubble>

            <SupportsBubble
              supports={coreInfo.core.framework.dock.analog_output}
            >
              {t("supports_items.dock_dac")}
            </SupportsBubble>

            <SupportsBubble
              supports={
                coreInfo.core.framework.hardware.cartridge_adapter !== -1
              }
            >
              {t("supports_items.cartridges")}
            </SupportsBubble>
          </div>
        </div>

        <div className="core-info__info-row">
          <strong>
            {t("platforms")}
            {":"}
          </strong>
          <Suspense
            fallback={<Loader className="core-info__platform-loader" />}
          >
            <div className="core-info__platforms">
              {coreInfo.core.metadata.platform_ids.map((id) => (
                <CorePlatformInfo platformId={id} key={id} />
              ))}
            </div>
          </Suspense>
        </div>
        <div className="core-info__info-row core-info__info-row--stretch">
          <button
            style={{ backgroundColor: "var(--light-colour)" }}
            onClick={() => setInputsOpen(true)}
          >
            {t("inputs")}
          </button>
          <button
            style={{ backgroundColor: "var(--light-colour)" }}
            onClick={() => setCoreSettingsOpen(true)}
          >
            {t("settings")}
          </button>
        </div>

        <div className="core-info__info-row">
          <Details title={t("info_txt_title")}>
            <InfoTxt coreName={coreName} />
          </Details>
        </div>

        <div className="core-info__info-row">
          <Details title={t("display_modes_title")}>
            <DisplayModes coreName={coreName} />
          </Details>
        </div>

        {inventoryItem && inventoryItem.repository.platform === "github" && (
          <Releases inventoryItem={inventoryItem} />
        )}
      </section>
    </div>
  )
}

const RequiredFilesButton = ({
  coreName,
  onClick,
}: {
  coreName: string
  onClick: () => void
}) => {
  const requiredFiles = useRecoilValue(
    RequiredFileInfoSelectorFamilyTwo(coreName)
  )
  const { t } = useTranslation("core_info")

  if (requiredFiles.length === 0) return null
  return (
    <ControlsButton onClick={onClick}>
      {t("controls.required_files")}
    </ControlsButton>
  )
}

const FirmwareWarning = ({ coreName }: { coreName: string }) => {
  const coreInfo = useRecoilValue(CoreInfoSelectorFamily(coreName))
  const currentFirmware = useRecoilValue(currentFirmwareVersionSelector)
  const setViewAndSubview = useSetRecoilState(currentViewAtom)
  const { t } = useTranslation("core_info")

  const firmwareTooLow = useMemo(() => {
    const [coreMajor, coreMinor] = coreInfo.core.framework.version_required
      .split(".")
      .map((v) => parseInt(v))
    const [pocketMajor, pocketMinor] = currentFirmware.version
      .split(".")
      .map((v) => parseInt(v))

    if (pocketMajor > coreMajor) return false
    if (pocketMajor === coreMajor && pocketMinor >= coreMinor) return false
    return true
  }, [coreInfo.core.framework.version_required, currentFirmware.version])

  if (!firmwareTooLow) return null
  return (
    <div
      className="core-info__firmware-warning"
      onClick={() => setViewAndSubview({ view: "Firmware", selected: null })}
    >
      <WarningIcon />
      {t("firmware_too_low", {
        core_firmware: coreInfo.core.framework.version_required,
        pocket_firmware: currentFirmware.version,
      })}
    </div>
  )
}

const InfoTxt = ({ coreName }: { coreName: string }) => {
  const infoTxt = useRecoilValue(CoreInfoTxtSelectorFamily(coreName))
  return <div className="core-info__info-txt">{infoTxt}</div>
}
