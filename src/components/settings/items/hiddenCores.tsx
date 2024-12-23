import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { PocketSyncConfigSelector } from "../../../recoil/config/selectors"
import { useUpdateConfig } from "../hooks/useUpdateConfig"
import { useTranslation } from "react-i18next"

export const HiddenCores = () => {
  const updateConfig = useUpdateConfig()
  const { t } = useTranslation("settings")
  const config = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    PocketSyncConfigSelector
  )
  const hiddenCores = config.hidden_cores ?? []

  const hasHiddenCores = hiddenCores.length !== 0

  return (
    <div className="settings__row">
      <h3 className="settings__row-title">{t("hidden_cores.title")}</h3>
      <div className="settings__ramble">{t("hidden_cores.ramble")}</div>
      <ul className="settings__items-input-list">
        {hiddenCores.map((coreName) => (
          <li
            key={coreName}
            className="settings__items-input-item"
            onClick={() =>
              updateConfig(
                "hidden_cores",
                hiddenCores.filter((c) => c !== coreName)
              )
            }
          >
            {coreName}
          </li>
        ))}
      </ul>
      {hasHiddenCores && (
        <button onClick={() => updateConfig("hidden_cores", [])}>
          {t("hidden_cores.button")}
        </button>
      )}
    </div>
  )
}
