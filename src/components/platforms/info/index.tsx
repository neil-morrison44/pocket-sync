import { Suspense, useMemo, useState } from "react"
import {
  PlatformInfoSelectorFamily,
  PlatformImageSelectorFamily,
  allCategoriesSelector,
} from "../../../recoil/platforms/selectors"
import { PlatformId } from "../../../types"
import { PLATFORM_IMAGE } from "../../../values"
import { Controls } from "../../controls"
import { Loader } from "../../loader"
import { useUpdatePlatformValue } from "../hooks/useUpdatePlatform"
import { ImagePacks } from "../imagePacks"
import { CoresForPlatform } from "./coresForPlatform"
import { Editable } from "./editable"
import { ImageEditor } from "./imageEditor"
import { DataPacks } from "../dataPacks"
import { useTranslation } from "react-i18next"
import { ControlsBackButton } from "../../controls/inputs/backButton"
import { ControlsButton } from "../../controls/inputs/button"
import { useAtomValue } from "jotai"

type PlatformInfoProps = {
  id: PlatformId
  onBack: () => void
}

export const PlatformInfo = ({ id, onBack }: PlatformInfoProps) => {
  const [imageEditorOpen, setImageEditorOpen] = useState(false)
  const { platform } = useAtomValue(PlatformInfoSelectorFamily(id))
  const platformImage = useAtomValue(PlatformImageSelectorFamily(id))
  const { t } = useTranslation("platform_info")

  const category = useMemo(
    () => platform.category || "Uncategorised",
    [platform.category]
  )

  const cats = useAtomValue(allCategoriesSelector)
  const [imagePacksOpen, setImagePacksOpen] = useState(false)
  const [dataPacksOpen, setDataPacksOpen] = useState(false)
  const updateValue = useUpdatePlatformValue(id)

  return (
    <div>
      <Controls>
        <ControlsBackButton onClick={onBack}>
          {t("controls.back")}
        </ControlsBackButton>
        <ControlsButton onClick={() => setDataPacksOpen(true)}>
          {t("controls.data_packs")}
        </ControlsButton>
        <ControlsButton onClick={() => setImagePacksOpen(true)}>
          {t("controls.image_packs")}
        </ControlsButton>
      </Controls>

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

      <div>
        <div className="platform__image-editable">
          <img
            className="platform-info__image"
            onClick={() => setImageEditorOpen(true)}
            src={platformImage}
          />
          <div className="platform__image-edit">{t("edit")}</div>
        </div>
        <div className="platform__info-blurb">
          <Editable
            initialValue={platform.name}
            type="freetext"
            onSave={(v) => updateValue("name", v)}
          />

          <Editable
            initialValue={category}
            type="freetext-with-choices"
            options={cats}
            onSave={(v) => updateValue("category", v)}
          />

          <Editable
            initialValue={platform.manufacturer}
            type="freetext"
            onSave={(v) => updateValue("manufacturer", v)}
          />

          <Editable
            initialValue={platform.year}
            type="number"
            onSave={(v) => updateValue("year", v)}
          />
        </div>

        <div>
          <h3 className="platform-info__cores-title">{t("cores")}: </h3>
          <Suspense fallback={<Loader />}>
            <CoresForPlatform platformId={id} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
