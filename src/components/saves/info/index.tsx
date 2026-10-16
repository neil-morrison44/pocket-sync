import Callout from "../../ui/Callout"
import {
  CSSProperties,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  AllBackupZipsFilesSelectorFamily,
  pocketSavesFilesListSelector,
} from "../../../jotai/saves/selectors"
import { PlatformId, SaveZipFile } from "../../../types"
import { invokeRestoreZip } from "../../../utils/invokes"
import { Controls } from "../../controls"
import { ask } from "@tauri-apps/plugin-dialog"
import { useSaveScroll } from "../../../hooks/useSaveScroll"
import { splitAsPath } from "../../../utils/splitAsPath"
import { PlatformLabel } from "./platformLabel"
import { useTranslation } from "react-i18next"
import { ControlsBackButton } from "../../controls/inputs/backButton"
import { ControlsCheckbox } from "../../controls/inputs/checkbox"
import { ControlsSearch } from "../../controls/inputs/search"
import { useAtomValue } from "jotai"
import IconButton from "../../ui/IconButton"
import { pocketPathAtom } from "../../../jotai/atoms"
import { revealFile } from "../../../utils/openFolder"
import { gameDisplayName } from "../../../utils/gameName"

export const SaveInfo = ({
  backupPath,
  onBack,
}: {
  backupPath: string
  onBack: () => void
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const zipFilesInfo = useAtomValue(
    AllBackupZipsFilesSelectorFamily(backupPath)
  )
  const [hideOnlyCurrent, setHideOnlyCurrent] = useState(true)
  const pocketSaves = useAtomValue(pocketSavesFilesListSelector)
  const { popScroll, pushScroll } = useSaveScroll()
  const { t } = useTranslation("save_info")

  useEffect(() => {
    popScroll()
  }, [pocketSaves, popScroll])

  // Oldest first: a bar spans backups that follow each other in time
  const sortedZips = useMemo(
    () =>
      [...zipFilesInfo].sort(
        (a, b) => a.zip.last_modified - b.zip.last_modified
      ),
    [zipFilesInfo]
  )

  const perSaveFormat = useMemo(() => {
    const perSave: {
      [filename: string]: SaveVersion[]
    } = {}

    sortedZips.forEach(({ zip, files }) => {
      files
        .filter((f) => f.filename.endsWith(".sav"))
        .forEach(({ filename, last_modified, crc32 }) => {
          const existing = perSave[filename]
          if (existing) {
            existing.push({ zip, last_modified, crc32 })
          } else {
            perSave[filename] = [{ zip, last_modified, crc32 }]
          }
        })
    })

    return Object.fromEntries(
      Object.entries(perSave).filter(([_, files]) => {
        const uniqueFiles = Array.from(new Set(files.map((f) => f.crc32)))
        return !hideOnlyCurrent || uniqueFiles.length > 1
      })
    )
  }, [sortedZips, hideOnlyCurrent])

  const filteredSaves = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(perSaveFormat).filter(([filename]) =>
          filename.toLowerCase().includes(searchQuery.toLowerCase())
        )
      ),

    [perSaveFormat, searchQuery]
  )

  const groupedFilteredSaves = useMemo(() => {
    const groups: { platform: PlatformId; saves: typeof filteredSaves }[] = []

    Object.entries(filteredSaves).forEach(([key, value]) => {
      const [platformId] = splitAsPath(key)
      const existing = groups.find(({ platform }) => platformId === platform)

      if (existing) {
        existing.saves[key] = value
      } else {
        groups.push({ platform: platformId, saves: { [key]: value } })
      }
    })
    return groups
  }, [filteredSaves])

  const restore = useCallback(
    async (zip: string, savefile: string) => {
      const zipPath = `${backupPath}/${zip}`
      const yes = await ask(t("confirm_restore"), "Pocket Sync")
      if (yes) {
        await invokeRestoreZip(zipPath, savefile)
        pushScroll()
      }
    },
    [backupPath, pushScroll, t]
  )

  const gridStyling = useMemo<CSSProperties>(() => {
    const timestamps = sortedZips.map(({ zip: { last_modified } }) =>
      getAreaName(last_modified)
    )

    return {
      gap: "5px",
      display: "grid",
      gridTemplateAreas: `'${timestamps.join(" ")}'`,
      gridTemplateColumns: `${timestamps.map(() => "1fr").join(" ")}`,
    } as CSSProperties
  }, [sortedZips])

  return (
    <div className="saves saves--info">
      <Controls>
        <ControlsBackButton onClick={onBack}>
          {t("controls.back")}
        </ControlsBackButton>
        <ControlsCheckbox
          checked={hideOnlyCurrent}
          onChange={setHideOnlyCurrent}
        >
          {t("controls.hide_unchanged")}
        </ControlsCheckbox>
        <ControlsSearch
          placeholder={t("controls.search")}
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </Controls>

      <Callout className="callout--in-page">{t("explainer")}</Callout>

      {/* The column lines fill this, not the header bar and hint above */}
      <div className="saves__info-table">
        <div className="saves__info-save-files-timestamps" style={gridStyling}>
          {sortedZips.map(({ zip }) => {
            const date = new Date(zip.last_modified * 1000)
            return (
              <div
                className="saves__info-timestamp"
                key={zip.last_modified}
                style={{
                  gridArea: getAreaName(zip.last_modified),
                }}
              >
                <span>{t("date", { date })}</span>
                <span className="saves__info-time">{t("time", { date })}</span>
              </div>
            )
          })}
        </div>

        <div className="saves__info-save-files-background" style={gridStyling}>
          {sortedZips.map(({ zip }) => (
            <div
              className="saves__info-save-files-background-column"
              key={zip.last_modified}
              style={{
                gridArea: getAreaName(zip.last_modified),
              }}
            ></div>
          ))}
        </div>

        {groupedFilteredSaves.map(({ platform, saves }) => (
          <Fragment key={platform}>
            <PlatformLabel id={platform} />
            <div className="saves__info-save-files">
              {Object.entries(saves).map(([savefile, versions]) => (
                <SaveVersions
                  key={savefile}
                  backupPath={backupPath}
                  savefile={savefile}
                  versions={versions}
                  gridStyling={gridStyling}
                  onSelect={restore}
                  currentHash={
                    pocketSaves.find(({ filename }) => filename === savefile)
                      ?.crc32
                  }
                />
              ))}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}

const SaveVersions = ({
  savefile,
  versions,
  currentHash,
  onSelect,
  gridStyling,
}: {
  backupPath: string
  savefile: string
  currentHash?: number
  gridStyling: CSSProperties
  onSelect: (zip: string, filename: string) => void
  versions: SaveVersion[]
}) => {
  const { t } = useTranslation("save_info")
  const pocketPath = useAtomValue(pocketPathAtom)
  const currentTimestamp =
    versions.find(({ crc32 }) => crc32 === currentHash)?.zip.last_modified ||
    Infinity
  const fileName = splitAsPath(savefile).at(-1) ?? savefile

  return (
    <div className="saves__info-save-file">
      {/* The game's name, then where its save is, small, with a button to
          show it on the SD card */}
      <div className="saves__info-save-file-header">
        <span className="saves__info-save-file-name">
          {gameDisplayName(fileName)}
        </span>
        <span className="saves__info-save-file-path">{`Saves/${savefile.replace(/^\//, "")}`}</span>
        {pocketPath && (
          <IconButton
            theme="tertiary"
            icon="folder"
            label={t("show_on_sd_card")}
            className="saves__info-save-file-reveal"
            onClick={() =>
              revealFile(`${pocketPath}/Saves/${savefile.replace(/^\//, "")}`)
            }
          />
        )}
      </div>
      <div className="saves__info-save-file-versions" style={gridStyling}>
        {versions.map(({ zip, crc32 }, index) => {
          // skip ones we've already drawn the box for
          if (versions.findIndex(({ crc32: h }) => h === crc32) !== index) {
            return null
          }

          const isCurrent = currentHash === crc32
          const lastVersionWithHash = getEndOfSave(index, versions)

          const text = isCurrent
            ? t("current")
            : zip.last_modified < currentTimestamp
              ? t("older")
              : t("newer")

          const style = {
            gridColumnStart: getAreaName(zip.last_modified),
            gridColumnEnd: getAreaName(lastVersionWithHash.zip.last_modified),
          }

          if (isCurrent) {
            return (
              <div
                key={zip.filename}
                className="saves__info-save-file-version saves__info-save-file-version--current"
                style={style}
              >
                {text}
              </div>
            )
          }

          return (
            <button
              type="button"
              key={zip.filename}
              className="saves__info-save-file-version saves__info-save-file-version--other"
              style={style}
              aria-label={t("restore_version", {
                date: new Date(zip.last_modified * 1000),
              })}
              onClick={() => onSelect(zip.filename, savefile)}
            >
              <span className="saves__info-label">{text}</span>
              <span className="saves__info-restore">{t("restore")}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

type SaveVersion = { zip: SaveZipFile; last_modified: number; crc32: number }

const getEndOfSave = (index: number, versions: SaveVersion[]) => {
  let currentIndex = index
  const crc32 = versions[index].crc32
  while (versions[currentIndex + 1]?.crc32 === crc32) {
    currentIndex += 1
  }

  return versions[currentIndex]
}

const getAreaName = (timestamp: number): string => `c${timestamp.toString(16)}`
