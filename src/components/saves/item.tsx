import { confirm } from "@tauri-apps/plugin-dialog"
import { useCallback, useState } from "react"

import {
  AllSavesSelector,
  BackupZipsSelectorFamily,
  backupsRefreshAtom,
} from "../../jotai/saves/selectors"
import { SaveConfig } from "../../types"
import { useUpdateConfig } from "../settings/hooks/useUpdateConfig"
import { useTranslation } from "react-i18next"
import { useAtomValue, useSetAtom } from "jotai"
import Button from "../ui/Button"
import PathField from "../ui/PathField"
import { TimeAgo } from "../newsFeed/timeAgo"
import { invokeBackupSaves } from "../../utils/invokes"
import { openFolder } from "../../utils/openFolder"

type SavesItemProps = {
  config: SaveConfig
  onClickRestore: () => void
  /**
   * Position in the list, shown as "Location {number}" to tell locations
   * apart.
   */
  number: number
}

export const SavesItem = ({
  config,
  onClickRestore,
  number,
}: SavesItemProps) => {
  const { files, exists } = useAtomValue(
    BackupZipsSelectorFamily(config.backup_location)
  )

  const updateConfig = useUpdateConfig()
  const { t } = useTranslation("saves")
  const allSaves = useAtomValue(AllSavesSelector)
  const refreshBackups = useSetAtom(backupsRefreshAtom)
  const [backingUp, setBackingUp] = useState(false)

  const backUpNow = useCallback(async () => {
    setBackingUp(true)
    try {
      await invokeBackupSaves(
        allSaves,
        config.backup_location,
        config.backup_count
      )
    } finally {
      setBackingUp(false)
      refreshBackups((count) => count + 1)
    }
  }, [allSaves, config, refreshBackups])

  const remove = useCallback(async () => {
    const shouldDelete = await confirm(t("confirm_delete"))
    if (!shouldDelete) return

    await updateConfig("saves", (currentSaves) =>
      currentSaves.filter((s) => s !== config)
    )
  }, [config, t, updateConfig])

  const latest = files.at(-1)
  const folderName =
    config.backup_location.split(/[\\/]/).filter(Boolean).at(-1) ??
    config.backup_location

  return (
    <div className={`saves__item ${exists ? "" : "saves__item--not-found"}`}>
      <div className="saves__item-title">
        {t("location_title", { number })}
        <span className="saves__item-folder">{folderName}</span>
      </div>

      <div className="saves__info">
        <PathField
          value={config.backup_location}
          copyLabel={t("copy_path")}
          copiedLabel={t("copied")}
          onOpen={() => openFolder(config.backup_location)}
          openLabel={t("open_folder")}
        />
        {exists ? (
          <div className="saves__stats">
            <span>
              {t("last_backup_label")}
              {": "}
              {latest ? (
                <TimeAgo since={latest.last_modified * 1000} />
              ) : (
                t("never")
              )}
            </span>
            <span>{t("backups", { count: files.length })}</span>
            {files.length > 0 && (
              <span>
                {t("oldest_backup", {
                  date: new Date((files[0]?.last_modified || 0) * 1000),
                })}
              </span>
            )}
          </div>
        ) : (
          <div>{t("not_found")}</div>
        )}
      </div>

      <div className="saves__item-actions">
        {exists && (
          <>
            <Button icon="save" disabled={backingUp} onClick={backUpNow}>
              {backingUp ? t("backing_up") : t("back_up_now")}
            </Button>
            <Button
              theme="tertiary"
              icon="chevron-right"
              onClick={onClickRestore}
            >
              {t("view_saves")}
            </Button>
          </>
        )}
        <Button
          theme="destructive"
          icon="trash"
          onClick={remove}
          className="saves__item-remove"
        >
          {t("remove")}
        </Button>
      </div>
    </div>
  )
}
