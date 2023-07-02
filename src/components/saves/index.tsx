import { useCallback, useState } from "react"
import { useRecoilValue } from "recoil"
import { PocketSyncConfigSelector } from "../../recoil/config/selectors"
import { Controls } from "../controls"
import { useUpdateConfig } from "../settings/hooks/useUpdateConfig"
import { open } from "@tauri-apps/api/dialog"

import "./index.css"
import { SavesItem } from "./item"
import { SaveInfo } from "./info"
import { AllSavesSelector } from "../../recoil/saves/selectors"
import { invokeBackupSaves } from "../../utils/invokes"
import { SaveConfig } from "../../types"
import { MisterSync } from "./misterSync"
import { useTranslation } from "react-i18next"

export const Saves = () => {
  const [selectedSaveBackup, setSelectedSavebackup] = useState<number | null>(
    null
  )
  const allSaves = useRecoilValue(AllSavesSelector)
  const updateConfig = useUpdateConfig()
  const { saves } = useRecoilValue(PocketSyncConfigSelector)
  const { t } = useTranslation("saves")

  const [misterSync, setMisterSync] = useState(false)

  const addBackupLocation = useCallback(async () => {
    const directory = await open({
      directory: true,
      multiple: false,
    })

    if (!directory) return

    const newSaveLocation = {
      type: "zip",
      backup_location: directory as string,
      backup_count: 6,
    } satisfies SaveConfig

    await updateConfig("saves", [...saves, newSaveLocation])

    await invokeBackupSaves(
      allSaves,
      newSaveLocation.backup_location,
      newSaveLocation.backup_count
    )
  }, [saves])

  if (selectedSaveBackup !== null)
    return (
      <SaveInfo
        backupPath={saves[selectedSaveBackup].backup_location}
        onBack={() => setSelectedSavebackup(null)}
      />
    )

  if (misterSync) return <MisterSync onClose={() => setMisterSync(false)} />

  return (
    <div className="saves">
      <Controls
        controls={[
          {
            type: "button",
            text: t("controls.add_backup_location"),
            onClick: addBackupLocation,
          },
          {
            type: "button",
            text: t("controls.mister_sync"),
            onClick: () => setMisterSync(true),
          },
        ]}
      />

      {saves.length === 0 && <div className="saves__none">{t("none")}</div>}
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
