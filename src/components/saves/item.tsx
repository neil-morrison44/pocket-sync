import { confirm } from "@tauri-apps/plugin-dialog"
import { useCallback } from "react"
import { useRecoilValue } from "recoil"
import { BackupZipsSelectorFamily } from "../../recoil/saves/selectors"
import { SaveConfig } from "../../types"
import { useUpdateConfig } from "../settings/hooks/useUpdateConfig"
import { useTranslation } from "react-i18next"

type SavesItemProps = {
  config: SaveConfig
  onClickRestore: () => void
}

export const SavesItem = ({ config, onClickRestore }: SavesItemProps) => {
  const { files, exists } = useRecoilValue(
    BackupZipsSelectorFamily(config.backup_location)
  )

  const updateConfig = useUpdateConfig()
  const { t } = useTranslation("saves")

  const remove = useCallback(async () => {
    const shouldDelete = await confirm(t("confirm_delete"))
    if (!shouldDelete) return

    await updateConfig("saves", (currentSaves) =>
      currentSaves.filter((s) => s !== config)
    )
  }, [config, t, updateConfig])

  if (!exists) {
    return (
      <div className="saves__item saves__item--not-found">
        <div className="saves__item-path">{config.backup_location}</div>
        <div className="saves__info">{t("not_found")}</div>
      </div>
    )
  }

  return (
    <div className="saves__item">
      <div className="saves__item-path">{config.backup_location}</div>
      <div className="saves__info">
        <div>{t("backups", { count: files.length })}</div>
        {files.length > 0 && (
          <>
            <div>
              {t("latest_backup", {
                date: new Date(
                  (files[files.length - 1]?.last_modified || 0) * 1000
                ),
              })}
            </div>
            <div>
              {t("oldest_backup", {
                date: new Date((files[0]?.last_modified || 0) * 1000),
              })}
            </div>
          </>
        )}
      </div>

      <div className="saves__item-remove-button" onClick={remove}>
        {t("remove")}
      </div>

      <div className="saves__item-restore-button" onClick={onClickRestore}>
        {t("view_saves")}
      </div>
    </div>
  )
}
