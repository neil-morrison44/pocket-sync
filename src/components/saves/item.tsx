import { useRecoilValue } from "recoil"
import { BackupZipsSelectorFamily } from "../../recoil/saves/selectors"
import { SaveConfig } from "../../types"
import { useBuildSaveZip } from "./hooks/useBuildsaveZip"

type SavesItemProps = {
  config: SaveConfig
  onClickRestore: () => void
}

export const SavesItem = ({ config, onClickRestore }: SavesItemProps) => {
  const { backup, backupInProgress } = useBuildSaveZip()

  const { files, exists } = useRecoilValue(
    BackupZipsSelectorFamily(config.backup_location)
  )

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
      <div
        className={`saves__item-sync-button saves__item-sync-button--${
          backupInProgress ? "in-progress" : "standby"
        }`}
        onClick={
          backupInProgress
            ? undefined
            : () => backup(config.backup_location, config.backup_count)
        }
      >
        {"Backup Now"}
      </div>
      <div className="saves__item-path">{config.backup_location}</div>
      <div className="saves__info">
        <div>{`Backups: ${files.length}`}</div>
        {files.length > 0 && (
          <>
            <div>{`Last Backup: ${new Date(
              (files.at(-1)?.last_modified || 0) * 1000
            ).toLocaleString()}`}</div>
            <div>{`Oldest Backup: ${new Date(
              (files.at(0)?.last_modified || 0) * 1000
            ).toLocaleString()}`}</div>
          </>
        )}
      </div>

      <div className="saves__item-restore-button" onClick={onClickRestore}>
        {"View Saves"}
      </div>
    </div>
  )
}
