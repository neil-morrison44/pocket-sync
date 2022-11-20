import { useRecoilValue } from "recoil"
import { BackupZipsSelectorFamily } from "../../recoil/selectors"
import { SaveConfig } from "../../types"
import { useBuildSaveZip } from "./hooks/useBuildsaveZip"

type SavesItemProps = {
  config: SaveConfig
  onClickRestore: () => void
}

export const SavesItem = ({ config, onClickRestore }: SavesItemProps) => {
  const saveZip = useBuildSaveZip()

  const saveZipList = useRecoilValue(
    BackupZipsSelectorFamily(config.backup_location)
  )

  return (
    <div className="saves__item">
      <div
        className="saves__item-sync-button"
        onClick={() => saveZip(config.backup_location, config.backup_count)}
      >
        {"Backup Now"}
      </div>
      <div className="saves__item-path">{config.backup_location}</div>
      <div className="saves__info">
        <div>{`Backups: ${saveZipList.length}`}</div>
        {saveZipList.length > 0 && (
          <>
            <div>{`Last Backup: ${new Date(
              (saveZipList.at(-1)?.last_modified || 0) * 1000
            ).toLocaleString()}`}</div>
            <div>{`Oldest Backup: ${new Date(
              (saveZipList.at(0)?.last_modified || 0) * 1000
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
