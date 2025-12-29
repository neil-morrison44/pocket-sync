import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { pocketPathAtom } from "../../../recoil/atoms"
import { Modal } from "../../modal"

import "./index.css"
import { useTranslation } from "react-i18next"
import { useAtomValue } from "jotai"
import {
  libraryImageSelector,
  mromDumpedROMSListSelector,
} from "../../../recoil/games/selectors"
import { FileCopy, MROMInfo } from "../../../types"
import { invokeCopyFiles, invokeMoveGame } from "../../../utils/invokes"

type MROMModalProps = {
  onClose: () => void
}

type MROMInfoAndState = MROMInfo & {
  dest: string
  save: "none" | "dump" | "pocket"
}

export const MROMModal = ({ onClose }: MROMModalProps) => {
  const romDumps = useAtomValue(mromDumpedROMSListSelector)
  const [isMovingDumps, setIsMovingDumps] = useState<boolean>(false)
  const { t } = useTranslation("mrom")

  const initialDumpState = useMemo<MROMInfoAndState[]>(() => {
    return romDumps.map((dump) => {
      const platformMap = {
        DMG: "gb",
        CGB: "gbc",
      }
      const dest = `/Assets/${
        platformMap[dump.platform]
      }/common/${dump.name.replace(/(\.gbc?)/i, (m) => m.toLowerCase())}`
      const save = dump.dumpedSave
        ? "dump"
        : dump.pocketSave
        ? "pocket"
        : "none"

      return { ...dump, dest, save }
    })
  }, [romDumps])

  const [dumps, setDumps] = useState<MROMInfoAndState[]>(initialDumpState)

  useEffect(() => {
    if (romDumps.length === 0) setDumps([])
  }, [romDumps])

  const onMoveDumps = useCallback(async () => {
    setIsMovingDumps(true)

    for (let index = 0; index < dumps.length; index++) {
      const dump = dumps[index]
      if (dump.save === "dump" && dump.dumpedSave) {
        invokeCopyFiles([
          {
            origin: dump.dumpedSave,
            destination: dump.path
              .replace("Assets", "Save")
              .replace(/\.gb|.gbc/, ".sav"),
            exists: true,
          },
        ])
      }
      await invokeMoveGame(dump.path, dump.dest)
    }
    setIsMovingDumps(false)
  }, [dumps])

  return (
    <Modal className="mrom">
      <h2>{t("title")}</h2>

      <ol className="mrom__items-list">
        <div className="mrom__items-header">
          <div>{t("headers.platform")}</div>
          <div>{t("headers.library_image")}</div>
          <div>{t("headers.name")}</div>
          <div>{t("headers.destination")}</div>
          <div>{t("headers.dumped_save")}</div>
          <div>{t("headers.pocket_save")}</div>
        </div>
        {dumps.map((dump, index) => {
          return (
            <MROMItem
              key={dump.crc32}
              dump={dump}
              onChange={(updatedDump) => {
                const newDumps = [...dumps]
                newDumps[index] = updatedDump
                setDumps(newDumps)
              }}
            />
          )
        })}
      </ol>
      {!isMovingDumps && (
        <button onClick={onMoveDumps}>{t("move_dumps")}</button>
      )}
      <button onClick={onClose}>{t("close_button")}</button>
    </Modal>
  )
}

type MROMItemProps = {
  dump: MROMInfoAndState
  onChange: (update: MROMInfoAndState) => void
}

const MROMItem = ({ dump, onChange }: MROMItemProps) => {
  const { name, crc32, platform, dest, save } = dump
  const libraryImage = useAtomValue(libraryImageSelector({ platform, crc32 }))

  return (
    <li className="mrom__list-item">
      <div className="mrom__list-item-platform">{platform}</div>
      <img className="mrom__list-item-image" src={libraryImage} />
      <div className="mrom__list-item-name">{name}</div>
      <input
        className="mrom__list-item-dest"
        type="text"
        value={dest}
        onChange={({ target }) => onChange({ ...dump, dest: target.value })}
      />
      <input
        className="mrom__list-item-dumped-save"
        type="checkbox"
        checked={save === "dump"}
        disabled={dump.dumpedSave === undefined}
        onChange={({ target }) => {
          onChange({ ...dump, save: target.checked ? "dump" : "none" })
        }}
      />
      <input
        className="mrom__list-item-pocket-save"
        type="checkbox"
        checked={save === "pocket"}
        disabled={dump.pocketSave === undefined}
        onChange={({ target }) => {
          onChange({ ...dump, save: target.checked ? "pocket" : "none" })
        }}
      />
    </li>
  )
}
