import { startTransition, Suspense, useCallback, useState } from "react"
import {
  PlatformInfoSelectorFamily,
  allCategoriesSelector,
  PlatformIsArchivedSelectorFamily,
} from "../../../jotai/platforms/selectors"
import { PlatformId } from "../../../types"
import { PLATFORM_IMAGE } from "../../../values"
import { useUpdatePlatformValue } from "../hooks/useUpdatePlatform"
import { ImagePacks } from "../imagePacks"
import { CoresForPlatform } from "./coresForPlatform"
import { Editable } from "./editable"
import { ImageEditor } from "./imageEditor"
import { DataPacks } from "../dataPacks"
import { useTranslation } from "react-i18next"
import IconButton from "../../ui/IconButton"
import { useAtomValue } from "jotai"
import { invokeArchiveUnarchivePlatforms } from "../../../utils/invokes"
import { PlatformImage } from "../../cores/platformImage"
import {
  DetailHeading,
  DetailPage,
  DetailSection,
} from "../../shared/detailPage"
import Icon from "../../ui/Icon"
import Skeleton from "../../ui/Skeleton"
import Tag, { TagList } from "../../ui/Tag"

import "./index.css"

type PlatformInfoProps = {
  id: PlatformId
  onBack: () => void
}

/**
 * One platform, laid out like a core: its image as the banner (click to
 * edit it), its details as editable fields, and the cores that run it.
 */
export const PlatformInfo = ({ id, onBack }: PlatformInfoProps) => {
  const [imageEditorOpen, setImageEditorOpen] = useState(false)
  const { platform } = useAtomValue(PlatformInfoSelectorFamily(id))
  const isArchived = useAtomValue(PlatformIsArchivedSelectorFamily(id))
  const { t } = useTranslation("platform_info")
  const { t: tPlatforms } = useTranslation("platforms")
  const { t: tCores } = useTranslation("cores")

  const cats = useAtomValue(allCategoriesSelector)
  const [imagePacksOpen, setImagePacksOpen] = useState(false)
  const [dataPacksOpen, setDataPacksOpen] = useState(false)
  const updateValue = useUpdatePlatformValue(id, isArchived)

  const renderActions = (tooltipSide: "top" | "bottom") => (
    <>
      <IconButton
        icon="archive"
        label={isArchived ? t("controls.unarchive") : t("controls.archive")}
        tooltipSide={tooltipSide}
        onClick={() => toggleArchiveStatus()}
      />
      <IconButton
        icon="memory-stick"
        label={t("controls.data_packs")}
        tooltipSide={tooltipSide}
        onClick={() => setDataPacksOpen(true)}
      />
      <IconButton
        icon="image"
        label={t("controls.image_packs")}
        tooltipSide={tooltipSide}
        onClick={() => setImagePacksOpen(true)}
      />
    </>
  )

  const toggleArchiveStatus = useCallback(() => {
    startTransition(() =>
      invokeArchiveUnarchivePlatforms(
        isArchived ? [] : [id],
        isArchived ? [id] : []
      )
    )
  }, [id, isArchived])

  return (
    <DetailPage
      className="platform-info"
      backLabel={t("controls.back")}
      onBack={onBack}
      title={platform.name}
      titleDetail={platform.manufacturer}
      actions={renderActions("bottom")}
      banner={
        <button
          type="button"
          className="platform-info__banner-button"
          onClick={() => setImageEditorOpen(true)}
        >
          <PlatformImage
            className="detail-page__banner"
            platformId={id}
            label={platform.name}
          />
          <span className="platform-info__banner-edit">
            <Icon icon="pencil" />
            {t("edit")}
          </span>
        </button>
      }
    >
      {imagePacksOpen && (
        <ImagePacks
          onClose={() => setImagePacksOpen(false)}
          singlePlatformId={id}
        />
      )}

      {dataPacksOpen && (
        <DataPacks onClose={() => setDataPacksOpen(false)} platformId={id} />
      )}

      {imageEditorOpen && (
        <ImageEditor
          path={`Platforms/_images/${id}.bin`}
          width={PLATFORM_IMAGE.WIDTH}
          height={PLATFORM_IMAGE.HEIGHT}
          onClose={() => setImageEditorOpen(false)}
        />
      )}

      <div className="detail-page__content">
        <DetailHeading title={platform.name} actions={renderActions("top")}>
          <span className="platform-info__line">
            {[platform.manufacturer, platform.year].join(", ")}
          </span>
          <TagList>
            {platform.category && <Tag>{platform.category}</Tag>}
            {isArchived && <Tag icon="archive">{tPlatforms("archived")}</Tag>}
          </TagList>
        </DetailHeading>

        <DetailSection title={t("details")}>
          <div className="platform-info__fields">
            <Editable
              label={tCores("controls.sort_options.name")}
              initialValue={platform.name}
              type="freetext"
              onSave={(v) => updateValue("name", v)}
            />
            <Editable
              label={tPlatforms("archive.filters.category")}
              initialValue={platform.category ?? ""}
              type="freetext-with-choices"
              options={cats}
              onSave={(v) => updateValue("category", v)}
            />
            <Editable
              label={tPlatforms("archive.filters.manufacturer")}
              initialValue={platform.manufacturer}
              type="freetext"
              onSave={(v) => updateValue("manufacturer", v)}
            />
            <Editable
              label={tPlatforms("archive.filters.year")}
              initialValue={platform.year}
              type="number"
              onSave={(v) => updateValue("year", v)}
            />
          </div>
        </DetailSection>

        <DetailSection title={t("cores")}>
          <Suspense fallback={<Skeleton height={160} />}>
            <CoresForPlatform platformId={id} />
          </Suspense>
        </DetailSection>
      </div>
    </DetailPage>
  )
}
