import { useRecoilValue, useRecoilValueLoadable } from "recoil"
import { CoreInfoSelectorFamily } from "../../../recoil/selectors"
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
import { ReactNode, Suspense, useState } from "react"
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
  const [inputsOpen, setInputsOpen] = useState(false)
  const [coreSettingsOpen, setCoreSettingsOpen] = useState(false)

  return (
    <div className="core-info">
      <Controls
        controls={[
          {
            type: "back-button",
            text: "Back to list",
            onClick: onBack,
          },
          {
            type: "button",
            text: "Uninstall",
            onClick: () => uninstall(coreName),
          },
          requiredFilesLoadable.state === "hasValue" &&
          requiredFilesLoadable.getValue().length > 0
            ? {
                type: "button",
                text: "Required Files",
                onClick: () => setRequiredFilesOpen(true),
              }
            : null,
          downloadUrl && {
            type: "button",
            text: "Update",
            onClick: () => installCore(coreName, downloadUrl),
          },
        ]}
      />

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
          platformId={coreInfo.core.metadata.platform_ids[0]}
        />
      )}

      {coreSettingsOpen && (
        <CoreSettings
          coreName={coreName}
          onClose={() => setCoreSettingsOpen(false)}
        />
      )}

      <h3 className="core-info__title">{coreInfo.core.metadata.shortname}</h3>
      {coreInfo.core.metadata.platform_ids.map((platformId) => (
        <PlatformImage
          className="core-info__image"
          platformId={platformId}
          key={platformId}
        />
      ))}

      <section className="core-info__info">
        <p>{coreInfo.core.metadata.description}</p>

        <div className="core-info__info-grid">
          <div className="core-info__info-row">
            <strong>{"Version:"}</strong>
            <Version coreName={coreName} />
          </div>

          <div className="core-info__info-row">
            <strong>{"Author:"}</strong>
            <AuthorTag coreName={coreName} />
          </div>

          {inventoryItem?.sponsor && (
            <div className="core-info__info-row core-info__info-row--right">
              <strong>{"Sponsor:"}</strong>
              <ErrorBoundary>
                <SponsorLinks links={inventoryItem.sponsor} />
              </ErrorBoundary>
            </div>
          )}

          {coreInfo.core.metadata.url && (
            <div className="core-info__info-row">
              <strong>{"URL:"}</strong>

              <Link href={coreInfo.core.metadata.url}>
                {coreInfo.core.metadata.url}
              </Link>
            </div>
          )}

          <Suspense
            fallback={
              <div className="core-info__info-row">
                <strong>{"Required Files:"}</strong>
                Please wait, checking files...
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
              <strong>{"Release Date:"}</strong>

              {coreInfo.core.metadata.date_release}
            </div>
          )}
        </div>

        <div className="core-info__info-row">
          <strong>{"Supports:"}</strong>
          <div className="core-info__supports-bubbles">
            <SupportsBubble supports={coreInfo.core.framework.sleep_supported}>
              {"Save States / Sleep"}
            </SupportsBubble>

            <SupportsBubble supports={coreInfo.core.framework.dock.supported}>
              {"Dock"}
            </SupportsBubble>

            <SupportsBubble
              supports={coreInfo.core.framework.dock.analog_output}
            >
              {"Dock (Analog)"}
            </SupportsBubble>

            <SupportsBubble
              supports={
                coreInfo.core.framework.hardware.cartridge_adapter !== -1
              }
            >
              {"Cartridges"}
            </SupportsBubble>
          </div>
        </div>

        <div className="core-info__info-row">
          <strong>{"Platforms:"}</strong>
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
            Inputs
          </button>
          <button
            style={{ backgroundColor: "var(--light-colour)" }}
            onClick={() => setCoreSettingsOpen(true)}
          >
            Settings
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
