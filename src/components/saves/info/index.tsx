import {
  CSSProperties,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"
import { PlatformInfoSelectorFamily } from "../../../recoil/selectors"
import {
  AllBackupZipsFilesSelectorFamily,
  pocketSavesFilesListSelector,
} from "../../../recoil/saves/selectors"
import { PlatformId, SaveZipFile } from "../../../types"
import { invokeRestoreZip } from "../../../utils/invokes"
import { Controls } from "../../controls"
import { ask } from "@tauri-apps/api/dialog"
import { saveFileInvalidationAtom } from "../../../recoil/atoms"
import { useSaveScroll } from "../../../hooks/useSaveScroll"

export const SaveInfo = ({
  backupPath,
  onBack,
}: {
  backupPath: string
  onBack: () => void
}) => {
  const invalidateSaveFileList = useSetRecoilState(saveFileInvalidationAtom)
  const [searchQuery, setSearchQuery] = useState("")
  const zipFilesInfo = useRecoilValue(
    AllBackupZipsFilesSelectorFamily(backupPath)
  )
  const [hideOnlyCurrent, setHideOnlyCurrent] = useState(true)

  const pocketSaves = useRecoilValue(pocketSavesFilesListSelector)
  const { popScroll, pushScroll } = useSaveScroll()

  useEffect(() => {
    popScroll()
  }, [pocketSaves])

  const perSaveFormat = useMemo(() => {
    const perSave: {
      [filename: string]: SaveVersion[]
    } = {}

    zipFilesInfo.forEach(({ zip, files }) => {
      files
        .filter((f) => f.filename.endsWith(".sav"))
        .forEach(({ filename, last_modified, hash }) => {
          const existing = perSave[filename]
          if (existing) {
            existing.push({ zip, last_modified, hash })
          } else {
            perSave[filename] = [{ zip, last_modified, hash }]
          }
        })
    })

    return Object.fromEntries(
      Object.entries(perSave).filter(([_, files]) => {
        const uniqueFiles = Array.from(new Set(files.map((f) => f.hash)))
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
      const [_, platformId] = key.split("/")
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
      const yes = await ask(`Restore from backup?`, "Pocket Sync")
      if (yes) {
        await invokeRestoreZip(zipPath, savefile)
        pushScroll()
        invalidateSaveFileList(Date.now())
      }
    },
    [backupPath, invalidateSaveFileList, pushScroll]
  )

  const gridStyling = useMemo<CSSProperties>(() => {
    const timestamps = zipFilesInfo.map(({ zip: { last_modified } }) =>
      getAreaName(last_modified)
    )

    return {
      gap: "10px",
      display: "grid",
      gridTemplateAreas: `'${timestamps.join(" ")}'`,
      gridTemplateColumns: `${timestamps.map(() => "1fr").join(" ")}`,
    } as CSSProperties
  }, [zipFilesInfo])

  return (
    <div className="saves">
      <Controls
        controls={[
          {
            type: "back-button",
            text: "Back to list",
            onClick: onBack,
          },
          {
            type: "checkbox",
            checked: hideOnlyCurrent,
            text: "Hide Unchanged",
            onChange: (v) => setHideOnlyCurrent(v),
          },
          {
            type: "search",
            text: "Search",
            value: searchQuery,
            onChange: (v) => {
              setSearchQuery(v)
            },
          },
        ]}
      ></Controls>

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
              <div>{date.toLocaleDateString()}</div>
              <div>{date.toLocaleTimeString()}</div>
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
                    ?.hash
                }
              />
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  )
}

const PlatformLabel = ({ id }: { id: PlatformId }) => {
  const { platform } = useRecoilValue(PlatformInfoSelectorFamily(id))
  return <div className="saves__info-save-files-platform">{platform.name}</div>
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
  currentHash?: string
  gridStyling: CSSProperties
  onSelect: (zip: string, filename: string) => void
  versions: SaveVersion[]
}) => {
  const currentTimestamp =
    versions.find(({ hash }) => hash === currentHash)?.zip.last_modified || 0

  return (
    <div className="saves__info-save-file">
      <div className="saves__info-save-file-path">{`${savefile}`}</div>
      <div className="saves__info-save-file-versions" style={gridStyling}>
        {versions.map(({ zip, hash }, index) => {
          // skip ones we've already drawn the box for
          if (versions.findIndex(({ hash: h }) => h === hash) !== index) {
            return null
          }

          const isCurrent = currentHash === hash
          const lastVersionWithHash = getEndOfSave(index, versions)

          const text = isCurrent
            ? "Current"
            : zip.last_modified < currentTimestamp
            ? "Older"
            : "Newer"

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

type SaveVersion = { zip: SaveZipFile; last_modified: number; hash: string }

const getEndOfSave = (index: number, versions: SaveVersion[]) => {
  let currentIndex = index
  const hash = versions[index].hash
  while (versions[currentIndex + 1]?.hash === hash) {
    currentIndex += 1
  }

  return versions[currentIndex]
}

const getAreaName = (timestamp: number): string => `c${timestamp.toString(16)}`
