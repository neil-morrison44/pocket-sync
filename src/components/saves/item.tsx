import { confirm } from "@tauri-apps/api/dialog"
import { useCallback } from "react"
import { useRecoilValue } from "recoil"
import { useInvalidateFileSystem } from "../../hooks/invalidation"
import { BackupZipsSelectorFamily } from "../../recoil/saves/selectors"
import { SaveConfig } from "../../types"
import { useUpdateConfig } from "../settings/hooks/useUpdateConfig"

type SavesItemProps = {
  config: SaveConfig
  onClickRestore: () => void
}

export const SavesItem = ({ config, onClickRestore }: SavesItemProps) => {
  const { files, exists } = useRecoilValue(
    BackupZipsSelectorFamily(config.backup_location)
  )

  const invalidateFS = useInvalidateFileSystem()

  const updateConfig = useUpdateConfig()

  const remove = useCallback(async () => {
    const shouldDelete = await confirm(
      "Are you sure you want to remove this backup location?"
    )
    if (!shouldDelete) return

    await updateConfig("saves", (currentSaves) =>
      currentSaves.filter((s) => s !== config)
    )

    invalidateFS()
  }, [])

  if (!exists) {
    return (
      <div className="saves__item saves__item--not-found">
        <div className="saves__item-path">{config.backup_location}</div>
        <div className="saves__info">{"Not found"}</div>
      </div>
    )
  }

  return (
    <div className="saves__item">
      <div className="saves__item-path">{config.backup_location}</div>
      <div className="saves__info">
        <div>{`Backups: ${files.length}`}</div>
        {files.length > 0 && (
          <>
            <div>{`Last Backup: ${new Date(
              (files[files.length - 1]?.last_modified || 0) * 1000
            ).toLocaleString()}`}</div>
            <div>{`Oldest Backup: ${new Date(
              (files[0]?.last_modified || 0) * 1000
            ).toLocaleString()}`}</div>
          </>
        )}
      </div>

      <div className="saves__item-remove-button" onClick={remove}>
        {"Remove Location"}
      </div>

      <div className="saves__item-restore-button" onClick={onClickRestore}>
        {"View Saves"}
      </div>
    </div>
  )
}
