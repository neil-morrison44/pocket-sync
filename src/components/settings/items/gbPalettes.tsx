import { PocketSyncConfigSelector } from "../../../jotai/config/selectors"
import { useUpdateConfig } from "../hooks/useUpdateConfig"
import { useTranslation } from "react-i18next"
import { invokeConvertAllPalFiles } from "../../../utils/invokes"
import { useProgress } from "../../../hooks/useProgress"
import { ProgressLoader } from "../../loader/progress"
import { useAtomValue } from "jotai"
import Switch from "../../ui/Switch"

export const GBPalettesConversion = () => {
  const updateConfig = useUpdateConfig()
  const { t } = useTranslation("settings")
  const config = useAtomValue(PocketSyncConfigSelector)
  const { inProgress, percent } = useProgress("downconvert_all_pal_files")

  return (
    <div className="settings__row" id="settings-gb_palettes_conversion">
      <h3 className="settings__row-title">
        {t("gb_palettes_conversion.title")}
      </h3>
      <div className="settings__ramble">
        {t("gb_palettes_conversion.ramble")}
      </div>
      <Switch
        className="settings__checkbox"
        label={t("gb_palettes_conversion.checkbox")}
        value={config.gb_palette_convert ?? false}
        onChange={(checked) => {
          if (checked) invokeConvertAllPalFiles()
          updateConfig("gb_palette_convert", checked)
        }}
      />
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
