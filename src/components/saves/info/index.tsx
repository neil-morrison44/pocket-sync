import {
  CSSProperties,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useRecoilValue } from "recoil"
import {
  AllBackupZipsFilesSelectorFamily,
  pocketSavesFilesListSelector,
} from "../../../recoil/saves/selectors"
import { PlatformId, SaveZipFile } from "../../../types"
import { invokeRestoreZip } from "../../../utils/invokes"
import { Controls } from "../../controls"
import { ask } from "@tauri-apps/plugin-dialog"
import { useSaveScroll } from "../../../hooks/useSaveScroll"
import { useInvalidateSaveFiles } from "../../../hooks/invalidation"
import { splitAsPath } from "../../../utils/splitAsPath"
import { PlatformLabel } from "./platformLabel"
import { useTranslation } from "react-i18next"
import { ControlsBackButton } from "../../controls/inputs/backButton"
import { ControlsCheckbox } from "../../controls/inputs/checkbox"
import { ControlsSearch } from "../../controls/inputs/search"

export const SaveInfo = ({
  backupPath,
  onBack,
}: {
  backupPath: string
  onBack: () => void
}) => {
  const invalidateSaveFileList = useInvalidateSaveFiles()
  const [searchQuery, setSearchQuery] = useState("")
  const zipFilesInfo = useRecoilValue(
    AllBackupZipsFilesSelectorFamily(backupPath)
  )
  const [hideOnlyCurrent, setHideOnlyCurrent] = useState(true)
  const pocketSaves = useRecoilValue(pocketSavesFilesListSelector)
  const { popScroll, pushScroll } = useSaveScroll()
  const { t } = useTranslation("save_info")

  useEffect(() => {
    popScroll()
  }, [pocketSaves, popScroll])

  const perSaveFormat = useMemo(() => {
    const perSave: {
      [filename: string]: SaveVersion[]
    } = {}

    zipFilesInfo.forEach(({ zip, files }) => {
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
  }, [zipFilesInfo, hideOnlyCurrent])

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
        invalidateSaveFileList()
      }
    },
    [backupPath, invalidateSaveFileList, pushScroll, t]
  )

  const gridStyling = useMemo<CSSProperties>(() => {
    const timestamps = zipFilesInfo.map(({ zip: { last_modified } }) =>
      getAreaName(last_modified)
    )

    return {
      gap: "5px",
      display: "grid",
      gridTemplateAreas: `'${timestamps.join(" ")}'`,
      gridTemplateColumns: `${timestamps.map(() => "1fr").join(" ")}`,
    } as CSSProperties
  }, [zipFilesInfo])

  return (
    <div className="saves">
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

      <div className="saves__info-save-files-timestamps" style={gridStyling}>
        {zipFilesInfo.map(({ zip }) => {
          const date = new Date(zip.last_modified * 1000)
          return (
            <div
              className="saves__info-timestamp"
              key={zip.last_modified}
              style={{
                gridArea: getAreaName(zip.last_modified),
              }}
            >
              <div>{t("date", { date })}</div>
              <div>{t("time", { date })}</div>
            </div>
          )
        })}
      </div>

      <div className="saves__info-save-files-background" style={gridStyling}>
        {zipFilesInfo.map(({ zip }) => (
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
  const currentTimestamp =
    versions.find(({ crc32 }) => crc32 === currentHash)?.zip.last_modified ||
    Infinity

  return (
    <div className="saves__info-save-file">
      <div className="saves__info-save-file-path">{savefile}</div>
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

          return (
            <div
              key={zip.filename}
              className={`saves__info-save-file-version saves__info-save-file-version--${
                isCurrent ? "current" : "other"
              }`}
              onClick={
                isCurrent ? undefined : () => onSelect(zip.filename, savefile)
              }
              style={{
                gridColumnStart: getAreaName(zip.last_modified),
                gridColumnEnd: getAreaName(
                  lastVersionWithHash.zip.last_modified
                ),
              }}
            >
              <div>{text}</div>
            </div>
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
