import {
  CoreAuthorImageSelectorFamily,
  CoreInfoSelectorFamily,
  CoreMainPlatformIdSelectorFamily,
} from "../../../jotai/selectors"
import { DownloadURLSelectorFamily } from "../../../jotai/inventory/selectors"
import {
  DetailFact,
  DetailFacts,
  DetailHeading,
  DetailPage,
  DetailSection,
} from "../../shared/detailPage"
import { Link } from "../../link"

import "./index.css"
import { PlatformImage } from "../platformImage"
import { useInventoryItem } from "../../../hooks/useInventoryItem"
import { Releases } from "./releases"
import { useUninstallCore } from "../../../hooks/useUninstallCore"
import { useInstallCore } from "../../../hooks/useInstallCore"
import { useUpdateAvailable } from "../../../hooks/useUpdateAvailable"
import {
  startTransition,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from "react"
import {
  CorePlatformInfo,
  CorePlatformLine,
  CorePlatformName,
} from "./platform"
import { SponsorLinks } from "./sponsorLinks"
import { LoadRequiredFiles } from "./loadRequiredFiles"
import { ErrorBoundary } from "../../errorBoundary"
import { CoreInputs } from "./coreInputs"
import { CoreSettings } from "./coreSettings"
import { RequiredFileInfoSelectorFamily } from "../../../jotai/requiredFiles/selectors"
import { Trans, useTranslation } from "react-i18next"
import { currentViewAtom } from "../../../jotai/view/atoms"
import { useReplacementAvailable } from "../../../hooks/useReplacementAvailable"
import { DisplayModes } from "./displayModes"
import { DownloadCount } from "./downloadCounts"
import { JTAnalogizerSettings } from "./jtanalogizer"
import { useAtomValue, useSetAtom } from "jotai"
import { useSmoothedAtomValue } from "../../../utils/jotai"
import { aiCheckAtom } from "../../../jotai/cores/atoms"
import { AIReport } from "./aiReport"
import { PocketSyncConfigSelector } from "../../../jotai/config/selectors"
import Accordion, { AccordionItem } from "../../ui/Accordion"
import Button from "../../ui/Button"
import Icon from "../../ui/Icon"
import clsx from "clsx"
import Skeleton from "../../ui/Skeleton"
import Tabs from "../../ui/Tabs"
import { CoreTags } from "../tags"
import {
  CoreAuthor,
  CoreFeatureTags,
  CoreNotice,
  FirmwareWarning,
  InfoTxt,
} from "./shared"

type CoreInfoProps = {
  coreName: string
  onBack: () => void
}

/**
 * An installed core: who made it and its status on top, with what to do next
 * (update, load required files, uninstall); details in tabs below.
 */
export const InstalledCoreInfo = ({ coreName, onBack }: CoreInfoProps) => {
  const coreInfo = useSmoothedAtomValue(CoreInfoSelectorFamily(coreName))
  const authorImageSrc = useAtomValue(CoreAuthorImageSelectorFamily(coreName))
  const inventoryItem = useInventoryItem(coreName)
  const [requiredFilesOpen, setRequiredFilesOpen] = useState(false)
  const { t } = useTranslation("core_info")
  const setViewAndSubview = useSetAtom(currentViewAtom)
  const replacementCore = useReplacementAvailable(coreName)
  const { metadata, framework } = coreInfo.core

  const goToReplacement = useCallback(() => {
    setViewAndSubview({ view: "Cores", selected: replacementCore })
  }, [replacementCore, setViewAndSubview])

  const closeRequiredFiles = useCallback(() => setRequiredFilesOpen(false), [])

  const mainPlatformId = useSmoothedAtomValue(
    CoreMainPlatformIdSelectorFamily(coreName)
  )

  const tabs = [
    {
      value: "overview",
      label: t("tabs.overview"),
      content: <InstalledOverview coreName={coreName} />,
    },
    {
      value: "inputs",
      label: t("inputs"),
      content: (
        <Suspense fallback={<Skeleton height={320} />}>
          <CoreInputs coreName={coreName} />
        </Suspense>
      ),
    },
    {
      value: "settings",
      label: t("settings"),
      content: <SettingsTab coreName={coreName} />,
    },
    ...(inventoryItem
      ? [
          {
            value: "releases",
            label: t("tabs.releases"),
            content: (
              <Releases
                coreName={coreName}
                inventoryItem={inventoryItem}
                installedVersion={metadata.version}
              />
            ),
          },
        ]
      : []),
  ]

  return (
    <DetailPage
      className="core-info"
      backLabel={t("controls.back")}
      onBack={onBack}
      title={metadata.shortname}
      titleDetail={
        <Suspense>
          <CorePlatformName platformId={mainPlatformId} />
        </Suspense>
      }
      banner={
        <PlatformImage
          className="detail-page__banner"
          platformId={mainPlatformId}
          label={metadata.shortname}
        />
      }
    >
      {requiredFilesOpen && (
        <LoadRequiredFiles coreName={coreName} onClose={closeRequiredFiles} />
      )}

      <div className="detail-page__content">
        <div className="detail-page__hero">
          <DetailHeading title={metadata.shortname}>
            <Suspense>
              <CorePlatformLine platformId={mainPlatformId} />
            </Suspense>
            <div className="detail-page__byline">
              <CoreAuthor name={metadata.author} imageSrc={authorImageSrc} />
              <span className="core-info__version">{metadata.version}</span>
            </div>
            <CoreTags coreName={coreName} installed showInstalled />
          </DetailHeading>
          <Suspense>
            <InstalledActions
              coreName={coreName}
              onLoadRequiredFiles={() => setRequiredFilesOpen(true)}
            />
          </Suspense>
        </div>

        {replacementCore && (
          <CoreNotice theme="danger" icon="reload" onClick={goToReplacement}>
            <Trans t={t} i18nKey={"replaced"} values={{ replacementCore }}>
              {"_"}
              <strong>{"_"}</strong>
            </Trans>
          </CoreNotice>
        )}
        <FirmwareWarning versionRequired={framework.version_required} />

        <Tabs className="core-info__tabs" label={t("tabs.label")} tabs={tabs} />
      </div>
    </DetailPage>
  )
}

/** Next steps for an installed core, most important first. */
const InstalledActions = ({
  coreName,
  onLoadRequiredFiles,
}: {
  coreName: string
  onLoadRequiredFiles: () => void
}) => {
  const { t } = useTranslation("core_info")
  const coreInfo = useAtomValue(CoreInfoSelectorFamily(coreName))
  const updateVersion = useUpdateAvailable(coreName)
  const downloadUrl = useAtomValue(DownloadURLSelectorFamily(coreName))
  const requiredFiles = useAtomValue(RequiredFileInfoSelectorFamily(coreName))
  const uninstall = useUninstallCore()
  const { installCore } = useInstallCore()

  const foundCount = useMemo(
    () => requiredFiles.filter(({ status }) => status.type === "Exists").length,
    [requiredFiles]
  )
  const canUpdate = Boolean(updateVersion && downloadUrl)
  const filesMissing = foundCount < requiredFiles.length

  return (
    <div
      className={clsx(
        "core-info__actions",
        canUpdate && "core-info__actions--update"
      )}
    >
      {canUpdate ? (
        <>
          <strong className="core-info__actions-title">
            <Icon icon="upload" />
            {t("guide.update_title")}
          </strong>
          <p className="detail-page__hint">
            {t("guide.update", {
              version: updateVersion,
              installed: coreInfo.core.metadata.version,
            })}
          </p>
        </>
      ) : (
        <p className="detail-page__hint">
          <Icon icon="check" />
          {t("guide.up_to_date")}
        </p>
      )}

      {requiredFiles.length > 0 && (
        <p className="detail-page__hint">
          <Icon icon={filesMissing ? "warning-diamond" : "check"} />
          {filesMissing
            ? t("guide.required_files_missing", {
                count: foundCount,
                total: requiredFiles.length,
              })
            : t("guide.required_files_found", {
                total: requiredFiles.length,
              })}
        </p>
      )}

      <div className="core-info__action-buttons">
        {canUpdate && downloadUrl && (
          <Button
            theme="primary"
            icon="upload"
            onClick={() =>
              startTransition(() => installCore(coreName, downloadUrl))
            }
          >
            {t("controls.update_to", { version: updateVersion })}
          </Button>
        )}
        {requiredFiles.length > 0 && (
          <Button
            theme={filesMissing && !canUpdate ? "primary" : "secondary"}
            icon="folder"
            onClick={onLoadRequiredFiles}
          >
            {t("controls.required_files")}
          </Button>
        )}
        <Button
          theme="destructive"
          icon="trash"
          onClick={() => uninstall(coreName)}
        >
          {t("controls.uninstall")}
        </Button>
      </div>
    </div>
  )
}

const InstalledOverview = ({ coreName }: { coreName: string }) => {
  const { t } = useTranslation("core_info")
  const coreInfo = useAtomValue(CoreInfoSelectorFamily(coreName))
  const authorImageSrc = useAtomValue(CoreAuthorImageSelectorFamily(coreName))
  const inventoryItem = useInventoryItem(coreName)
  const config = useAtomValue(PocketSyncConfigSelector)
  const aiCheck = useAtomValue(aiCheckAtom)
  const { metadata, framework } = coreInfo.core
  const funding = inventoryItem?.repository.funding

  const coreAIScore = aiCheck[coreName]?.overall_score ?? 0
  const showAIReport = config.hide_ai_score !== true && coreAIScore > 0

  const facts: DetailFact[] = [
    {
      label: t("author"),
      value: <CoreAuthor name={metadata.author} imageSrc={authorImageSrc} />,
    },
    { label: t("version"), value: metadata.version },
  ]
  if (metadata.date_release)
    facts.push({ label: t("release_date"), value: metadata.date_release })
  facts.push({
    label: t("firmware_required"),
    value: framework.version_required,
  })
  if (inventoryItem?.repository.platform === "github")
    facts.push({
      label: t("download_count"),
      value: (
        <Suspense fallback={<Skeleton width={120} />}>
          <DownloadCount coreName={coreName} />
        </Suspense>
      ),
    })
  if (metadata.url)
    facts.push({
      label: t("url"),
      value: <Link href={metadata.url}>{metadata.url}</Link>,
    })
  if (funding)
    facts.push({
      label: t("sponsor"),
      value: (
        <ErrorBoundary>
          <SponsorLinks links={funding} />
        </ErrorBoundary>
      ),
    })

  return (
    <div className="core-info__overview">
      <div className="core-info__main">
        {metadata.description && (
          <p className="core-info__description">{metadata.description}</p>
        )}

        <CoreFeatureTags
          coreName={coreName}
          framework={inventoryItem?.releases[0].core.framework ?? framework}
        />

        <DetailSection title={t("platforms")}>
          <Suspense fallback={<Skeleton height={44} />}>
            <div className="core-info__platforms">
              {metadata.platform_ids.map((id) => (
                <CorePlatformInfo
                  platformId={id}
                  key={id}
                  showImage={metadata.platform_ids.length > 1}
                />
              ))}
            </div>
          </Suspense>
        </DetailSection>

        <Suspense fallback={<Skeleton height={80} />}>
          <InfoTxt coreName={coreName} />
        </Suspense>

        {showAIReport && (
          <Accordion type="single" collapsible>
            <AccordionItem
              value="ai"
              title={t("ai_ness_score", { score: coreAIScore })}
            >
              <AIReport coreName={coreName} />
            </AccordionItem>
          </Accordion>
        )}
      </div>

      <aside className="core-info__aside">
        <DetailFacts facts={facts} />
      </aside>
    </div>
  )
}

/** The core's own settings, its display modes and Analogizer options. */
const SettingsTab = ({ coreName }: { coreName: string }) => {
  const { t } = useTranslation("core_info")
  const coreInfo = useAtomValue(CoreInfoSelectorFamily(coreName))

  return (
    <div className="core-info__settings">
      <DetailSection title={t("core_settings_title")}>
        <p className="detail-page__hint">{t("core_settings_hint")}</p>
        <Suspense fallback={<Skeleton height={120} />}>
          <CoreSettings coreName={coreName} />
        </Suspense>
      </DetailSection>

      <DetailSection title={t("display_modes_title")}>
        <p className="detail-page__hint">{t("display_modes_hint")}</p>
        <Suspense fallback={<Skeleton height={80} />}>
          <DisplayModes coreName={coreName} />
        </Suspense>
      </DetailSection>

      {coreInfo.core.metadata.platform_ids.includes("jtpatreon") && (
        <JTAnalogizerSettings coreName={coreName} />
      )}
    </div>
  )
}
