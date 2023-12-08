import {
  useRecoilValue,
  useRecoilValueLoadable,
  useSetRecoilState,
} from "recoil"
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
import { ReactNode, Suspense, useCallback, useState } from "react"
import { CorePlatformInfo } from "./platform"
import { Loader } from "../../loader"
import { SponsorLinks } from "./sponsorLinks"
import { RequiredFiles } from "./requiredFiles"
import { LoadRequiredFiles } from "./loadRequiredFiles"
import { ErrorBoundary } from "../../errorBoundary"
import { AuthorTag } from "../../shared/authorTag"
import { CoreInputs } from "./coreInputs"
import { CoreSettings } from "./coreSettings"
import { RequiredFileInfoSelectorFamily } from "../../../recoil/requiredFiles/selectors"
import { Trans, useTranslation } from "react-i18next"
import { archiveBumpAtom } from "../../../recoil/archive/atoms"
import { currentViewAtom } from "../../../recoil/view/atoms"
import { useReplacementAvailable } from "../../../hooks/useReplacementAvailable"
import { ControlsBackButton } from "../../controls/inputs/backButton"
import { ControlsButton } from "../../controls/inputs/button"

type CoreInfoProps = {
  coreName: string
  onBack: () => void
}

export const InstalledCoreInfo = ({ coreName, onBack }: CoreInfoProps) => {
  const requiredFilesLoadable = useRecoilValueLoadable(
    RequiredFileInfoSelectorFamily(coreName)
  )
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
        {requiredFilesLoadable.state === "hasValue" &&
          requiredFilesLoadable.getValue().length > 0 && (
            <ControlsButton
              onClick={() => {
                setArchiveBump((a) => a + 1)
                setRequiredFilesOpen(true)
              }}
            >
              {t("controls.required_files")}
            </ControlsButton>
          )}
        {downloadUrl && (
          <ControlsButton onClick={() => installCore(coreName, downloadUrl)}>
            {t("controls.update")}
          </ControlsButton>
        )}
      </Controls>

      {requiredFilesOpen && (
        <LoadRequiredFiles
          coreName={coreName}
          onClose={() => setRequiredFilesOpen(false)}
        />
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

        {inventoryItem && inventoryItem.repository.platform === "github" && (
          <Releases inventoryItem={inventoryItem} />
        )}
      </section>
    </div>
  )
}

type SupportsBubbleProps = {
  children: ReactNode
  supports: boolean
}

const SupportsBubble = ({ supports, children }: SupportsBubbleProps) => (
  <div className={`core-info__supports core-info__supports--${supports}`}>
    {children}
  </div>
)
