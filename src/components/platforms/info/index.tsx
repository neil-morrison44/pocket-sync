import { useMemo, useState } from "react"
import { useRecoilValue } from "recoil"
import {
  PlatformInfoSelectorFamily,
  PlatformImageSelectorFamily,
  allCategoriesSelector,
} from "../../../recoil/platforms/selectors"
import { PlatformId } from "../../../types"
import { PLATFORM_IMAGE } from "../../../values"
import { Controls } from "../../controls"
import { useUpdatePlatformValue } from "../hooks/useUpdatePlatform"
import { Editable } from "./editable"
import { ImageEditor } from "./imageEditor"

type PlatformInfoProps = {
  id: PlatformId
  onBack: () => void
}

export const PlatformInfo = ({ id, onBack }: PlatformInfoProps) => {
  const [imageEditorOpen, setImageEditorOpen] = useState(false)
  const { platform } = useRecoilValue(PlatformInfoSelectorFamily(id))
  const platformImage = useRecoilValue(PlatformImageSelectorFamily(id))

  const category = useMemo(
    () => platform.category || "Uncategorised",
    [platform.category]
  )

  const cats = useRecoilValue(allCategoriesSelector)
  const updateValue = useUpdatePlatformValue(id)

  return (
    <div>
      <Controls
        controls={[
          {
            type: "back-button",
            text: "Back to list",
            onClick: onBack,
          },
        ]}
      />

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
            className="core-info__image"
            onClick={() => setImageEditorOpen(true)}
            src={platformImage}
          />
          <div className="platform__image-edit">Edit</div>
        </div>
        <div className="cores__info-blurb">
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
      </div>
    </div>
  )
}
