import {
  CSSProperties,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useRecoilValue, useResetRecoilState, useSetRecoilState } from "recoil"
import {
  AllBackupZipsFilesSelectorFamily,
  PlatformInfoSelectorFamily,
  pocketSavesFilesListSelector,
} from "../../../recoil/selectors"
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

  const pocketSaves = useRecoilValue(pocketSavesFilesListSelector)
  const { popScroll, pushScroll } = useSaveScroll()

  useEffect(() => {
    popScroll()
  }, [pocketSaves])

  const perSaveFormat = useMemo(() => {
    const perSave: {
      [filename: string]: {
        zip: SaveZipFile
        last_modified: number
        hash: string
      }[]
    } = {}

    zipFilesInfo.forEach(({ zip, files }) => {
      files
        .filter((f) => f.filename.endsWith(".sav"))
        .forEach(({ filename, last_modified, hash }) => {
          const existing = perSave[filename]
          if (existing) {
            if (
              !existing.find(({ hash: stored_hash }) => hash === stored_hash)
            ) {
              existing.push({ zip, last_modified, hash })
            }
          } else {
            perSave[filename] = [{ zip, last_modified, hash }]
          }
        })
    })

    return perSave
  }, [zipFilesInfo])

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
            type: "search",
            text: "Search",
            value: searchQuery,
            onChange: (v) => {
              setSearchQuery(v)
            },
          },
        ]}
      ></Controls>

      <div className="saves__info-save-files-background" style={gridStyling}>
        {zipFilesInfo.map(({ zip }) => (
          <div
            className="saves__info-save-files-background-column"
            key={zip.last_modified}
            style={{
              gridArea: getAreaName(zip.last_modified),
            }}
          >
            word
          </div>
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
  versions: { zip: SaveZipFile; last_modified: number; hash: string }[]
}) => (
  <div className="saves__info-save-file">
    <div>{`${savefile}`}</div>
    <div className="saves__info-save-file-versions" style={gridStyling}>
      {versions.map(({ zip, hash }) => (
        <div
          key={zip.filename}
          className="saves__info-save-file-version"
          onClick={() => onSelect(zip.filename, savefile)}
          style={{
            gridArea: getAreaName(zip.last_modified),
          }}
        >
          <div>{currentHash === hash ? "Current" : "Other"}</div>
        </div>
      ))}
    </div>
  </div>
)

const getAreaName = (timestamp: number): string =>
  timestamp
    .toString(16)
    .replaceAll("0", "zero")
    .replaceAll("1", "one")
    .replaceAll("2", "two")
    .replaceAll("3", "three")
    .replaceAll("4", "four")
    .replaceAll("5", "five")
    .replaceAll("6", "six")
    .replaceAll("7", "seven")
    .replaceAll("8", "eight")
    .replaceAll("9", "nine")
