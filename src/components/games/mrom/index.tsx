import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { pocketPathAtom } from "../../../jotai/atoms"
import { Modal, ModalSuspense } from "../../modal"

import "./index.css"
import Button from "../../ui/Button"
import Callout from "../../ui/Callout"
import Field from "../../ui/Field"
import Select from "../../ui/Select"
import Tag from "../../ui/Tag"
import TextInput from "../../ui/TextInput"
import { useTranslation } from "react-i18next"
import { useAtomValue } from "jotai"
import {
  libraryImageSelector,
  mromDumpedROMSListSelector,
} from "../../../jotai/games/selectors"
import { FileCopy, MROMInfo } from "../../../types"
import { invokeCopyFiles, invokeMoveGame } from "../../../utils/invokes"

type MROMModalProps = {
  onClose: () => void
  /**
   * Development only (Settings → Developer): made-up dumps instead of the
   * card's; moving them only waits a moment.
   */
  demo?: boolean
}

/** Cartridges for the demo: one with each kind of save (none in production). */
const DEMO_DUMPS: MROMInfo[] = !import.meta.env.DEV
  ? []
  : [
      {
        path: "Assets/mrom/common/DMG/Tetris.gb",
        platform: "DMG",
        name: "Tetris.gb",
        crc32: "46df91ad",
        dumpedSave: "Assets/mrom/common/DMG/Tetris.SAV",
      },
      {
        path: "Assets/mrom/common/CGB/Pokemon - Crystal Version.gbc",
        platform: "CGB",
        name: "Pokemon - Crystal Version.gbc",
        crc32: "ee6f5188",
        pocketSave: "Saves/mrom/common/CGB/Pokemon - Crystal Version.sav",
      },
      {
        path: "Assets/mrom/common/DMG/Link's Awakening.gb",
        platform: "DMG",
        name: "Link's Awakening.gb",
        crc32: "d5ab24d1",
      },
    ]

type MROMInfoAndState = MROMInfo & {
  dest: string
  save: "none" | "dump" | "pocket"
}

const RealMROMDumps = ({ onClose }: MROMModalProps) => (
  <MROMModalContent
    onClose={onClose}
    romDumps={useAtomValue(mromDumpedROMSListSelector)}
    demo={false}
  />
)

const MROMModalContent = ({
  onClose,
  romDumps,
  demo,
}: MROMModalProps & { romDumps: MROMInfo[]; demo: boolean }) => {
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
    if (demo) {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setIsMovingDumps(false)
      return
    }

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
  }, [dumps, demo])

  return (
    <Modal className="mrom" title={t("title")} onClose={onClose}>
      <p className="mrom__intro">{t("intro")}</p>

      {dumps.length === 0 ? (
        <Callout>{t("none_found")}</Callout>
      ) : (
        <ol className="mrom__items-list">
          {dumps.map((dump, index) => (
            <MROMItem
              key={dump.crc32}
              dump={dump}
              onChange={(updatedDump) => {
                const newDumps = [...dumps]
                newDumps[index] = updatedDump
                setDumps(newDumps)
              }}
            />
          ))}
        </ol>
      )}

      <div className="modal__actions">
        <Button theme="tertiary" disabled={isMovingDumps} onClick={onClose}>
          {t("close_button")}
        </Button>
        {dumps.length > 0 && (
          <Button
            theme="primary"
            disabled={isMovingDumps}
            onClick={onMoveDumps}
          >
            {isMovingDumps
              ? t("moving")
              : t("move_count", { count: dumps.length })}
          </Button>
        )}
      </div>
    </Modal>
  )
}

type MROMItemProps = {
  dump: MROMInfoAndState
  onChange: (update: MROMInfoAndState) => void
}

/**
 * One dumped cartridge: its library image, name and platform, where it
 * goes, and which save (if any) goes with it, with what that save is.
 */
const MROMItem = ({ dump, onChange }: MROMItemProps) => {
  const { name, crc32, platform, dest, save } = dump
  const libraryImage = useAtomValue(libraryImageSelector({ platform, crc32 }))
  const { t } = useTranslation("mrom")
  const id = `mrom-dest-${crc32}`

  return (
    <li className="mrom__list-item">
      <img className="mrom__list-item-image" src={libraryImage} alt="" />
      <div className="mrom__list-item-body">
        <div className="mrom__list-item-title">
          <span className="mrom__list-item-name">{name}</span>
          <Tag>{platform}</Tag>
        </div>
        <Field label={t("headers.destination")} htmlFor={id}>
          <TextInput
            id={id}
            variant="code"
            value={dest}
            onChange={(value) => onChange({ ...dump, dest: value })}
            spellCheck={false}
          />
        </Field>
        <Select
          label={t("save_label")}
          value={save}
          onChange={(value) => onChange({ ...dump, save: value })}
          options={[
            { value: "none", label: t("save.none") },
            {
              value: "dump",
              label: t("headers.dumped_save"),
              disabled: dump.dumpedSave === undefined,
            },
            {
              value: "pocket",
              label: t("headers.pocket_save"),
              disabled: dump.pocketSave === undefined,
            },
          ]}
        />
        <p className="mrom__save-hint">{t(`save_hint.${save}`)}</p>
      </div>
    </li>
  )
}

/** Opens right away with a loader while its data loads. */
export const MROMModal = (props: MROMModalProps) => {
  const { t } = useTranslation("mrom")
  return (
    <ModalSuspense className="mrom" title={t("title")} onClose={props.onClose}>
      {props.demo ? (
        <MROMModalContent onClose={props.onClose} romDumps={DEMO_DUMPS} demo />
      ) : (
        <RealMROMDumps {...props} />
      )}
    </ModalSuspense>
  )
}
