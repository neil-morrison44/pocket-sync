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

export const InstanceJson = ({ onClose }: BinCueJsonModalProp) => {
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

          const jsonPath = await path.join(
            pocketPath || "",
            "Assets",
            cueFile.replace("cue", "json")
          )

          const encoder = new TextEncoder()
          await invokeSaveFile(
            jsonPath,
            encoder.encode(JSON.stringify(interactJSON, null, 2))
          )
        }

        setBuildInProgress(false)
        invalidateFileSystem()
      },
    [setBuildInProgress, invalidateFileSystem]
  )

  return (
    <Modal className="instance-json">
      <h2>Build Instance JSON files</h2>
      <div className="instance-json__list">
        {cueFiles.map((f) => (
          <CueFileInfo key={f} path={f}></CueFileInfo>
        ))}
      </div>

      {buildInProgress && (
        <button>
          <Loader className="instance-json_button-loader" />
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
    <div className="instance-json__item">
      <div>{path}</div>
      <div
        className={`instance-json__bin-count ${
          warning ? "instance-json__bin-count--warning" : ""
        }`}
      >{`(${binFiles.length} bin files)`}</div>
    </div>
  )
}
