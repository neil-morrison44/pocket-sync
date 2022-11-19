import { useRecoilValue } from "recoil"
import { useInstallRequiredFiles } from "../../../../hooks/useInstallRequiredFiles"
import {
  PocketSyncConfigSelector,
  RequiredFileInfoSelectorFamily,
} from "../../../../recoil/selectors"
import { Modal } from "../../../modal"

import "./index.css"

type LoadRequiredFilesProps = {
  coreName: string
  onClose: () => void
}

export const LoadRequiredFiles = ({
  coreName,
  onClose,
}: LoadRequiredFilesProps) => {
  const requiredFiles = useRecoilValue(RequiredFileInfoSelectorFamily(coreName))
  const pocketSyncConfig = useRecoilValue(PocketSyncConfigSelector)

  const { installRequiredFiles, progress } = useInstallRequiredFiles(onClose)

  return (
    <Modal className="load-required-files">
      <h2>{"Required Files"}</h2>

      {progress && (
        <>
          <h1>{`${((progress.value / progress.max) * 100).toFixed(0)}%`}</h1>
          <progress
            className="zip-install__progress"
            value={progress.value}
            max={progress.max}
          />
        </>
      )}

      {!progress && (
        <>
          <div className="load-required-files__files">
            {requiredFiles.map((r) => {
              return (
                <div
                  key={r.path + r.filename}
                  className={`load-required-files__row load-required-files__row--${
                    r.exists ? "exists" : "missing"
                  }`}
                >
                  Put <pre>{`"${r.filename}"`}</pre> in{" "}
                  <pre>{`"${r.path}"`}</pre>
                </div>
              )
            })}
          </div>

          {!pocketSyncConfig.archive_url && (
            <p>
              {
                "Please view the `Settings` pane for more options with required files"
              }
            </p>
          )}
          <div className="load-required-files__buttons">
            <button onClick={onClose}>{"Cancel"}</button>

            {pocketSyncConfig.archive_url && (
              <button onClick={() => installRequiredFiles(requiredFiles)}>
                {"Download All"}
              </button>
            )}

            {pocketSyncConfig.archive_url && (
              <button
                onClick={() =>
                  installRequiredFiles(
                    requiredFiles.filter(({ exists }) => !exists)
                  )
                }
              >
                {"Download Missing"}
              </button>
            )}
          </div>
        </>
      )}
    </Modal>
  )
}
