import { save } from "@tauri-apps/api/dialog"
import { useCallback, useMemo, useState } from "react"
import { useRecoilValue } from "recoil"
import { AllBackupZipsFilesSelectorFamily } from "../../../recoil/selectors"
import { SaveBackupPathTime } from "../../../types"
import { invokeRestoreZip } from "../../../utils/invokes"
import { Controls } from "../../controls"
import { Link } from "../../link"
import { Tip } from "../../tip"

export const SaveInfo = ({
  backupPath,
  onBack,
}: {
  backupPath: string
  onBack: () => void
}) => {
  const [searchQuery, setSearchQuery] = useState("")

  const zipFilesInfo = useRecoilValue(
    AllBackupZipsFilesSelectorFamily(backupPath)
  )

  const perSaveFormat = useMemo(() => {
    const perSave: {
      [filename: string]: { zip: SaveBackupPathTime; last_modified: number }[]
    } = {}

    zipFilesInfo.forEach(({ zip, files }) => {
      files
        .filter((f) => f.filename.endsWith(".sav"))
        .forEach(({ filename, last_modified }) => {
          const existing = perSave[filename]
          if (existing) {
            if (
              !existing.find(
                ({ last_modified: stored_last_modified }) =>
                  last_modified === zip.last_modified
              )
            ) {
              existing.push({ zip, last_modified })
            }
          } else {
            perSave[filename] = [{ zip, last_modified }]
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

  return (
    <div>
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

      <div className="saves__info-save-files">
        {Object.entries(filteredSaves).map(([savefile, versions]) => {
          return (
            <SaveVersions
              key={savefile}
              backupPath={backupPath}
              savefile={savefile}
              versions={versions}
            />
          )
        })}
      </div>

      <Tip>
        {"This save backup system won't be as good as I'd like until "}
        <Link href={"https://github.com/zip-rs/zip/issues/331"}>
          {"this issue"}
        </Link>
        {" is fixed"}
      </Tip>
    </div>
  )
}

const SaveVersions = ({
  backupPath,
  savefile,
  versions,
}: {
  backupPath: string
  savefile: string
  versions: { zip: SaveBackupPathTime; last_modified: number }[]
}) => {
  const [isOpen, setIsOpen] = useState(true)

  const restore = useCallback(
    async (zip: string) => {
      const zipPath = `${backupPath}/${zip}`
      await invokeRestoreZip(zipPath, savefile)
    },
    [backupPath, savefile]
  )

  return (
    <div className="saves__info-save-file">
      <div
        onClick={() => setIsOpen((o) => !o)}
      >{`${savefile} (${versions.length})`}</div>

      {isOpen && (
        <div className="saves__info-save-file-versions">
          {versions.map(({ zip }) => (
            <div
              key={zip.filename}
              className="saves__info-save-file-version"
              onClick={() => {
                restore(zip.filename)
              }}
            >
              {new Date(zip.last_modified * 1000).toLocaleString()}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
