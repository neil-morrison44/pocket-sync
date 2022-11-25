import { useCallback, useState } from "react"
import { useRecoilValue } from "recoil"
import { PocketSyncConfigSelector } from "../../recoil/selectors"
import { Controls } from "../controls"
import { useUpdateConfig } from "../settings/hooks/useUpdateConfig"
import { open } from "@tauri-apps/api/dialog"

import "./index.css"
import { SavesItem } from "./item"
import { SaveInfo } from "./info"
import { Link } from "../link"
import { Tip } from "../tip"

export const Saves = () => {
  const [selectedSaveBackup, setSelectedSavebackup] = useState<number | null>(
    null
  )

  const updateConfig = useUpdateConfig()
  const { saves } = useRecoilValue(PocketSyncConfigSelector)
  const addBackupLocation = useCallback(async () => {
    const directory = await open({
      directory: true,
    })

    if (!directory) return

    updateConfig("saves", [
      ...saves,
      {
        type: "zip",
        backup_location: directory as string,
        backup_count: 6,
      },
    ])
  }, [saves])

  if (selectedSaveBackup !== null)
    return (
      <SaveInfo
        backupPath={saves[selectedSaveBackup].backup_location}
        onBack={() => setSelectedSavebackup(null)}
      />
    )

  return (
    <div className="saves">
      <Controls
        controls={[
          {
            type: "button",
            text: "Add backup location",
            onClick: addBackupLocation,
          },
        ]}
      />

      {saves.length === 0 && (
        <div className="saves__none">{"Add a backup location above"}</div>
      )}
      {saves.length > 0 && (
        <div className="saves__list">
          {saves.map((s, index) => (
            <SavesItem
              config={s}
              key={JSON.stringify(s)}
              onClickRestore={() => setSelectedSavebackup(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
