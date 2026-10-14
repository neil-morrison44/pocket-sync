import { Suspense, useCallback, useMemo } from "react"

import { useInstallCore } from "../../../hooks/useInstallCore"
import { useInventoryItem } from "../../../hooks/useInventoryItem"
import { DownloadURLSelectorFamily } from "../../../jotai/inventory/selectors"
import {
  DetailFact,
  DetailFacts,
  DetailHeading,
  DetailPage,
  DetailSection,
} from "../../shared/detailPage"
import { InventoryPlatformImage } from "../platformImage"
import {
  CorePlatformInfo,
  CorePlatformLine,
  CorePlatformName,
} from "./platform"
import { ErrorBoundary } from "../../errorBoundary"
import { Link } from "../../link"
import { Releases } from "./releases"
import { SponsorLinks } from "./sponsorLinks"
import { useTranslation } from "react-i18next"
import { DownloadCount } from "./downloadCounts"
import { PocketSyncConfigSelector } from "../../../jotai/config/selectors"
import { useUpdateConfig } from "../../settings/hooks/useUpdateConfig"
import { confirm } from "@tauri-apps/plugin-dialog"
import { useAtomValue } from "jotai"
import { useAtomCallback } from "jotai/utils"
import { aiCheckAtom } from "../../../jotai/cores/atoms"
import { AIReport } from "./aiReport"
import Accordion, { AccordionItem } from "../../ui/Accordion"
import Button from "../../ui/Button"
import Skeleton from "../../ui/Skeleton"
import Tabs from "../../ui/Tabs"
import { CoreTags } from "../tags"
import {
  CoreAuthor,
  CoreFeatureTags,
  CoreNotice,
  FirmwareWarning,
} from "./shared"

import "./index.css"

type NotInstalledCoreInfoProps = {
  onBack: () => void
  coreName: string
}

/**
 * A core from the inventory that isn't on the SD card yet: what it is, and
 * one clear Install step with what happens next.
 */
export const NotInstalledCoreInfo = ({
  coreName,
  onBack,
}: NotInstalledCoreInfoProps) => {
  const inventoryItem = useInventoryItem(coreName)
  const { t } = useTranslation("core_info")

  const latestRelease = inventoryItem?.releases[0]
  const metadata = latestRelease?.core.metadata
  const framework = latestRelease?.core.framework
  const platformId = metadata?.platform_ids[0]
  const requiresLicense = Boolean(latestRelease?.updaters?.license)
  const [author] = coreName.split(".")
  const authorImageUrl = `https://openfpga-library.github.io/analogue-pocket/assets/images/authors/${coreName}.png`

  const title = metadata?.shortname || platformId || coreName

  return (
    <DetailPage
      className="core-info"
      backLabel={t("controls.back")}
      onBack={onBack}
      title={title}
      titleDetail={
        platformId && (
          <Suspense>
            <CorePlatformName platformId={platformId} />
          </Suspense>
        )
      }
      banner={
        inventoryItem && (
          <InventoryPlatformImage
            className="detail-page__banner"
            platformId={platformId}
            label={title}
          />
        )
      }
    >
      {!inventoryItem && (
        <div className="detail-page__content">
          {t("not_in_inventory", { coreName })}
        </div>
      )}

      {inventoryItem && metadata && (
        <div className="detail-page__content">
          <div className="detail-page__hero">
            <DetailHeading title={title}>
              {platformId && (
                <Suspense>
                  <CorePlatformLine platformId={platformId} />
                </Suspense>
              )}
              <div className="detail-page__byline">
                <CoreAuthor
                  name={metadata.author || author}
                  imageSrc={authorImageUrl}
                />
                <span className="core-info__version">{metadata.version}</span>
              </div>
              <CoreTags coreName={coreName} installed={false} />
            </DetailHeading>
            <InstallAction
              coreName={coreName}
              version={metadata.version}
              onBack={onBack}
            />
          </div>

          {requiresLicense && (
            <CoreNotice theme="highlight" icon="key">
              {t("requires_license.all")}
              {inventoryItem.id.startsWith("jotego") && (
                <p>{t("requires_license.jotego")}</p>
              )}
            </CoreNotice>
          )}
          <FirmwareWarning versionRequired={framework?.version_required} />

          <Tabs
            className="core-info__tabs"
            label={t("tabs.label")}
            tabs={[
              {
                value: "overview",
                label: t("tabs.overview"),
                content: <NotInstalledOverview coreName={coreName} />,
              },
              {
                value: "releases",
                label: t("tabs.releases"),
                content: (
                  <Releases coreName={coreName} inventoryItem={inventoryItem} />
                ),
              },
            ]}
          />
        </div>
      )}
    </DetailPage>
  )
}

/** The one thing to do here, with what it does and what comes after. */
const InstallAction = ({
  coreName,
  version,
  onBack,
}: {
  coreName: string
  version: string
  /** Leaves the page after hiding the core. */
  onBack: () => void
}) => {
  const { t } = useTranslation("core_info")
  const downloadUrl = useAtomValue(DownloadURLSelectorFamily(coreName))
  const { installCore } = useInstallCore()

  if (!downloadUrl) return null
  return (
    <div className="core-info__actions">
      <p className="detail-page__hint">{t("guide.install", { version })}</p>
      <div className="core-info__action-buttons">
        <Button
          theme="primary"
          icon="download"
          onClick={() => installCore(coreName, downloadUrl)}
        >
          {t("controls.install")}
        </Button>
        <HideCoreButton onBack={onBack} coreName={coreName} />
      </div>
    </div>
  )
}

const NotInstalledOverview = ({ coreName }: { coreName: string }) => {
  const { t } = useTranslation("core_info")
  const inventoryItem = useInventoryItem(coreName)
  const config = useAtomValue(PocketSyncConfigSelector)
  const aiCheck = useAtomValue(aiCheckAtom)

  const coreAIScore = aiCheck[coreName]?.overall_score ?? 0
  const showAIReport = config.hide_ai_score !== true && coreAIScore > 0

  const repositoryUrl = useMemo(() => {
    if (inventoryItem?.repository.platform !== "github") return null
    return `https://github.com/${inventoryItem.repository.owner}/${inventoryItem.repository.name}`
  }, [inventoryItem])

  if (!inventoryItem) return null
  const { metadata, framework } = inventoryItem.releases[0].core
  const funding = inventoryItem.repository.funding
  const [author] = coreName.split(".")

  const facts: DetailFact[] = [
    {
      label: t("author"),
      value: (
        <CoreAuthor
          name={metadata.author || author}
          imageSrc={`https://openfpga-library.github.io/analogue-pocket/assets/images/authors/${coreName}.png`}
        />
      ),
    },
    { label: t("version"), value: metadata.version },
  ]
  if (metadata.date_release)
    facts.push({ label: t("release_date"), value: metadata.date_release })
  if (framework?.version_required)
    facts.push({
      label: t("firmware_required"),
      value: framework.version_required,
    })
  if (repositoryUrl)
    facts.push({
      label: t("download_count"),
      value: (
        <Suspense fallback={<Skeleton width={120} />}>
          <DownloadCount coreName={coreName} />
        </Suspense>
      ),
    })
  const url = metadata.url || repositoryUrl
  if (url) facts.push({ label: t("url"), value: <Link href={url}>{url}</Link> })
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

        <CoreFeatureTags coreName={coreName} framework={framework} />

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
    <Button
      theme="tertiary"
      className="core-info__action-aside"
      title={t("hide_core_confirm")}
      onClick={onClick}
    >
      {t("controls.hide_core")}
    </Button>
  )
}
