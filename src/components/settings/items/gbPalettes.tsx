import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { PocketSyncConfigSelector } from "../../../recoil/config/selectors"
import { useUpdateConfig } from "../hooks/useUpdateConfig"
import { useTranslation } from "react-i18next"
import { invokeConvertAllPalFiles } from "../../../utils/invokes"
import { useProgress } from "../../../hooks/useProgress"
import { ProgressLoader } from "../../loader/progress"

export const GBPalettesConversion = () => {
  const updateConfig = useUpdateConfig()
  const { t } = useTranslation("settings")
  const config = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    PocketSyncConfigSelector
  )

  const { inProgress, percent } = useProgress("downconvert_all_pal_files")

  return (
    <div className="settings__row">
      <h3 className="settings__row-title">
        {t("gb_palettes_conversion.title")}
      </h3>
      <div className="settings__ramble">
        {t("gb_palettes_conversion.ramble")}
      </div>
      <label className="settings__checkbox">
        {t("gb_palettes_conversion.checkbox")}
        <input
          type="checkbox"
          checked={config.gb_palette_convert}
          onChange={({ target }) => {
            if (target.checked) invokeConvertAllPalFiles()
            updateConfig("gb_palette_convert", target.checked)
          }}
        />
      </label>
      <ProgressLoader name="downconvert_all_pal_files" hideUntilProgress />
      {inProgress && (
        <progress
          id="download"
          className="settings__progress-bar"
          max={100}
          value={percent}
        ></progress>
      )}
    </div>
  )
}
