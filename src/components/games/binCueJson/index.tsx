import { path } from "@tauri-apps/api"
import { useState } from "react"
import { useRecoilCallback, useRecoilValue } from "recoil"
import { useInvalidateFileSystem } from "../../../hooks/invalidation"
import { pocketPathAtom } from "../../../recoil/atoms"
import {
  BinFilesForCueFileSelectorFamily,
  cueFilesSelector,
} from "../../../recoil/games/selectors"
import { invokeSaveFile } from "../../../utils/invokes"
import { Loader } from "../../loader"
import { Modal } from "../../modal"

import "./index.css"

type BinCueJsonModalProp = {
  onClose: () => void
}

const MAX_BIN_FILES = 31

export const BinCueJsonModal = ({ onClose }: BinCueJsonModalProp) => {
  const cueFiles = useRecoilValue(cueFilesSelector)
  const [buildInProgress, setBuildInProgress] = useState(false)
  const invalidateFileSystem = useInvalidateFileSystem()

  const buildJsonFiles = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        setBuildInProgress(true)
        const pocketPath = await snapshot.getPromise(pocketPathAtom)
        const cueFiles = await snapshot.getPromise(cueFilesSelector)

        for await (const cueFile of cueFiles) {
          const filename = await path.basename(cueFile)
          const folderPath = await path.join(
            "Assets",
            await path.dirname(cueFile)
          )
          const binFiles = await snapshot.getPromise(
            BinFilesForCueFileSelectorFamily(cueFile)
          )

          const binFileDataSlots = await Promise.all(
            binFiles.map(async (binFile, index) => ({
              id: 101 + index,
              filename: await path.basename(binFile),
            }))
          )

          const rawPath = await path.dirname(cueFile)
          const rawPathParts = rawPath.split(path.sep)
          const data_path = await path.join(
            ...rawPathParts.slice(rawPathParts.indexOf("common") + 1)
          )

          console.log({
            filename,
            folderPath,
            binFiles,
            binFileDataSlots,
            data_path,
          })

          const interactJSON = {
            instance: {
              magic: "APF_VER_1",
              variant_select: {
                id: 300,
                select: false,
              },
              data_path,
              data_slots: [{ id: 100, filename }, ...binFileDataSlots],
              memory_writes: [],
            },
          }

          // TODO: replace with finding the cores for the platforms
          // & putting in the right place dependant on the Paramters bitmap on the json entry in data.json
          const jsonPath = await path.join(
            pocketPath || "",
            "Assets",
            cueFile.replace("cue", "json")
          )

          console.log({ jsonPath, interactJSON })
          console.log(jsonPath)

          const encoder = new TextEncoder()
          await invokeSaveFile(
            jsonPath,
            encoder.encode(JSON.stringify(interactJSON, null, 2))
          )
        }

        setBuildInProgress(false)
      },
    [setBuildInProgress]
  )

  return (
    <Modal className="bin-and-cue-files">
      <h2>Build JSON files for .cue & .bin files</h2>
      <div className="bin-and-cue-files__list">
        {cueFiles.map((f) => (
          <CueFileInfo key={f} path={f}></CueFileInfo>
        ))}
      </div>

      {buildInProgress && (
        <button>
          <Loader className="bin-and-cue-files_button-loader" />
        </button>
      )}
      {!buildInProgress && (
        <>
          <button onClick={buildJsonFiles}>Build JSON files</button>
          <button onClick={onClose}>Close</button>
        </>
      )}
    </Modal>
  )
}

const CueFileInfo = ({ path }: { path: string }) => {
  const binFiles = useRecoilValue(BinFilesForCueFileSelectorFamily(path))
  const warning = binFiles.length > MAX_BIN_FILES

  return (
    <div className="bin-and-cue-files__item">
      <div>{path}</div>
      <div
        className={`bin-and-cue-files__bin-count ${
          warning ? "bin-and-cue-files__bin-count--warning" : ""
        }`}
      >{`(${binFiles.length} bin files)`}</div>
    </div>
  )
}
