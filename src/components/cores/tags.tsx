import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useAtomValue } from "jotai"

import { useUpdateAvailable } from "../../hooks/useUpdateAvailable"
import { useReplacementAvailable } from "../../hooks/useReplacementAvailable"
import { useInventoryItem } from "../../hooks/useInventoryItem"
import { PocketSyncConfigSelector } from "../../jotai/config/selectors"
import { aiCheckAtom } from "../../jotai/cores/atoms"
import Tag, { TagList } from "../ui/Tag"

type CoreTagsProps = {
  coreName: string
  /** Whether the core is on the SD card; enables the update and replaced tags. */
  installed: boolean
  /** Adds an "Installed" tag, for places that show both kinds of core. */
  showInstalled?: boolean
  className?: string
}

/**
 * A core's status at a glance: installed, update, replaced, Analogizer, AI
 * score and license. Features (dock, cartridges, …) are listed separately.
 */
export const CoreTags = ({
  coreName,
  installed,
  showInstalled = false,
  className,
}: CoreTagsProps) => {
  const { t } = useTranslation("core_info")
  const inventoryItem = useInventoryItem(coreName)
  const config = useAtomValue(PocketSyncConfigSelector)
  const aiCheck = useAtomValue(aiCheckAtom)

  const aiScore = useMemo(
    () => aiCheck[coreName]?.overall_score ?? 0,
    [coreName, aiCheck]
  )
  const showAIScore = config.hide_ai_score !== true && aiScore > 0
  const requiresLicense = Boolean(inventoryItem?.releases[0].updaters?.license)

  return (
    <TagList className={className}>
      {installed && (
        <InstalledTags coreName={coreName} showInstalled={showInstalled} />
      )}
      {installed && !inventoryItem && (
        <Tag icon="archive" title={t("tags.manual_hint")}>
          {t("tags.manual")}
        </Tag>
      )}
      {coreName.endsWith("_Analogizer") && (
        <Tag theme="analogizer" icon="analogizer">
          {t("supports_items.analogizer")}
        </Tag>
      )}
      {showAIScore && (
        <Tag theme="warning" title={t("ai_ness_score", { score: aiScore })}>
          {t("tags.ai", { score: aiScore })}
        </Tag>
      )}
      {requiresLicense && (
        <Tag theme="highlight" icon="key" title={t("requires_license.all")}>
          {t("tags.license")}
        </Tag>
      )}
    </TagList>
  )
}

const InstalledTags = ({
  coreName,
  showInstalled,
}: {
  coreName: string
  showInstalled: boolean
}) => {
  const { t } = useTranslation("core_info")
  const { t: tVersion } = useTranslation("version")
  const updateAvailable = useUpdateAvailable(coreName)
  const replacement = useReplacementAvailable(coreName)

  return (
    <>
      {showInstalled && <Tag icon="check">{t("tags.installed")}</Tag>}
      {updateAvailable && (
        <Tag
          theme="accent"
          icon="upload"
          title={tVersion("update_alt", { version: updateAvailable })}
        >
          {t("tags.update", { version: updateAvailable })}
        </Tag>
      )}
      {replacement && (
        <Tag
          theme="danger"
          icon="reload"
          title={tVersion("replaced_alt", { core: replacement })}
        >
          {tVersion("replaced")}
        </Tag>
      )}
    </>
  )
}
