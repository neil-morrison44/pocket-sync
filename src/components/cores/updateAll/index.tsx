import { useRecoilValue, useSetRecoilState } from "recoil"
import { Modal } from "../../modal"
import {
  Dispatch,
  SetStateAction,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import "./index.css"
import { installedCoresWithUpdatesSelector } from "../../../recoil/cores/selectors"
import { CoreMainPlatformIdSelectorFamily } from "../../../recoil/selectors"
import { PlatformImage } from "../platformImage"
import { enableGlobalZipInstallAtom } from "../../../recoil/atoms"
import { DownloadURLSelectorFamily } from "../../../recoil/inventory/selectors"
import { useInstallCore } from "../../../hooks/useInstallCore"
import { Progress } from "../../progress"
import { emit, listen } from "@tauri-apps/api/event"
import { InstallZipEventPayload } from "../../zipInstall/types"
import { message } from "@tauri-apps/api/dialog"
import { NotInstalledCoreInfo } from "../info/notInstalled"
import { useInvalidateFileSystem } from "../../../hooks/invalidation"
import { RequiredFilesWithStatusSelectorFamily } from "../../../recoil/archive/selectors"
import { PocketSyncConfigSelector } from "../../../recoil/config/selectors"
import { useProgress } from "../../../hooks/useProgress"
import { turboDownloadsAtom } from "../../../recoil/settings/atoms"
import { RequiredFileInfo } from "../../../types"
import { invoke } from "@tauri-apps/api"
import { Loader } from "../../loader"

type UpdateAllProps = {
  onClose: () => void
}

type UpdateListItem = {
  coreName: string
  requiredFiles: boolean
  platformFiles: boolean
}

type UpdateStage = {
  coreName: string
  step: "core" | "files"
}

export const UpdateAll = ({ onClose }: UpdateAllProps) => {
  const [updateList, setUpdateList] = useState<UpdateListItem[]>([])
  const [stage, setStage] = useState<UpdateStage | null>(null)
  const invalidateFS = useInvalidateFileSystem()
  const hasDoneAnUpdateRef = useRef(false)

  const setEnableGlobalZipInstall = useSetRecoilState(
    enableGlobalZipInstallAtom
  )

  useEffect(() => {
    setEnableGlobalZipInstall(false)
    return () => setEnableGlobalZipInstall(true)
  }, [setEnableGlobalZipInstall])

  const onFinish = useCallback(() => {
    setStage((currentStage) => {
      const updateListIndex = updateList.findIndex(
        ({ coreName }) => currentStage?.coreName === coreName
      )
      if (
        currentStage?.step === "core" &&
        updateList[updateListIndex].requiredFiles
      ) {
        return { ...currentStage, step: "files" }
      }

      if (updateListIndex + 1 < updateList.length) {
        return {
          coreName: updateList[updateListIndex + 1].coreName,
          step: "core",
        }
      }

      return null
    })
  }, [updateList, setStage])

  console.log({ stage })

  useEffect(() => {
    if (stage === null && hasDoneAnUpdateRef.current) {
      onClose()
      invalidateFS()
      return
    }
    if (stage !== null) hasDoneAnUpdateRef.current = true
  }, [invalidateFS, onClose, stage])

  const coreCount = useMemo(() => {
    const updateListIndex = updateList.findIndex(
      ({ coreName }) => stage?.coreName === coreName
    )

    return updateListIndex + 1 || 0
  }, [stage, updateList])

  return (
    <Modal className="update-all">
      <h2>{"Update All"}</h2>

      {stage === null && (
        <>
          <div className="update-all__list-item">
            <label
              className="update-all__list-item-update"
              onClick={() => setUpdateList([])}
            >
              {"Update"}
            </label>

            <label
              className="update-all__list-item-required-files"
              onClick={() =>
                setUpdateList((ul) =>
                  ul.map((u) => ({ ...u, requiredFiles: false }))
                )
              }
            >
              {"Install Required Files"}
            </label>

            <label
              className="update-all__list-item-platform-images"
              onClick={() =>
                setUpdateList((ul) =>
                  ul.map((u) => ({ ...u, platformFiles: false }))
                )
              }
            >
              {"Replace Platform Files"}
            </label>
          </div>
          <Suspense
            fallback={
              <div className="update-all__list">
                <Loader />
              </div>
            }
          >
            <UpdateAllList
              updateList={updateList}
              setUpdateList={setUpdateList}
            />
          </Suspense>
          {updateList.length > 0 && (
            <button
              onClick={() => {
                setStage({ coreName: updateList[0].coreName, step: "core" })
              }}
            >
              {"Update Selected"}
            </button>
          )}
          <button onClick={onClose}>{"Cancel"}</button>
        </>
      )}

      {stage && (
        <div className="update-all__step-info">
          <h3 className="update-all__step-info-title">{`Installing ${stage.step} for ${stage.coreName} ${coreCount}/${updateList.length}`}</h3>
          <div>
            <Suspense>
              <NotInstalledCoreInfo
                coreName={stage.coreName}
                onBack={() => {}}
                withoutControls
              />
            </Suspense>
          </div>
          <Suspense>
            {stage.step === "core" && (
              <AutoInstallCore
                key={stage.coreName}
                coreName={stage.coreName}
                onFinish={onFinish}
                platformFiles={
                  updateList.find(({ coreName: cn }) => cn === stage.coreName)
                    ?.platformFiles || false
                }
              />
            )}
            {stage.step === "files" && (
              <AutoInstallFiles
                key={stage.coreName}
                coreName={stage.coreName}
                onFinish={onFinish}
              />
            )}
          </Suspense>
        </div>
      )}
    </Modal>
  )
}

const UpdateAllList = ({
  updateList,
  setUpdateList,
}: {
  updateList: UpdateListItem[]
  setUpdateList: Dispatch<SetStateAction<UpdateListItem[]>>
}) => {
  const unsortedCoresList = useRecoilValue(installedCoresWithUpdatesSelector)

  const coresList = useMemo(
    () =>
      [...unsortedCoresList].sort((a, b) =>
        a.coreName.localeCompare(b.coreName)
      ),
    [unsortedCoresList]
  )

  useEffect(() => {
    setUpdateList(
      coresList.map(({ coreName }) => ({
        coreName,
        requiredFiles: true,
        platformFiles: true,
      }))
    )
  }, [coresList, setUpdateList])

  if (coresList.length === 0)
    return (
      <div className="update-all__list">
        <div className="update-all__no-updates">
          {"Everything's up to date!"}
        </div>
      </div>
    )

  return (
    <ol className="update-all__list">
      {coresList.map(({ coreName, installedVersion, latestVersion }) => (
        <UpdateListItem
          key={coreName}
          updateListItem={updateList.find(
            ({ coreName: cn }) => coreName === cn
          )}
          coreName={coreName}
          installedVersion={installedVersion}
          latestVersion={latestVersion}
          onChangeUpdate={(checked) => {
            setUpdateList((curr) => {
              if (checked) {
                return [
                  ...curr,
                  {
                    coreName,
                    requiredFiles: true,
                    platformFiles: true,
                  },
                ]
              } else {
                return curr.filter(({ coreName: cn }) => cn !== coreName)
              }
            })
          }}
          onChangeRequiredFiles={(checked) => {
            setUpdateList((curr) =>
              curr.map((core) => {
                if (core.coreName !== coreName) return core
                return { ...core, requiredFiles: checked }
              })
            )
          }}
          onChangePlatformFiles={(checked) => {
            setUpdateList((curr) =>
              curr.map((core) => {
                if (core.coreName !== coreName) return core
                return { ...core, platformFiles: checked }
              })
            )
          }}
        />
      ))}
    </ol>
  )
}

const AutoInstallFiles = ({
  coreName,
  onFinish,
}: {
  coreName: string
  onFinish: () => void
}) => {
  const stageRef = useRef<"unstarted" | "started" | "finished">("unstarted")
  const requiredFiles = useRecoilValue(
    RequiredFilesWithStatusSelectorFamily(coreName)
  )

  const { archive_url } = useRecoilValue(PocketSyncConfigSelector)

  const { percent, inProgress, lastMessage, remainingTime } = useProgress(
    () => {
      onFinish()
    }
  )

  const turboDownloads = useRecoilValue(turboDownloadsAtom)

  const installRequiredFiles = useCallback(
    async (files: RequiredFileInfo[], other_archive_url?: string) => {
      const this_archive_url = other_archive_url ?? archive_url
      if (!this_archive_url)
        throw new Error("Attempt to download without an `archive_url` set")

      const _response = await invoke<boolean>("install_archive_files", {
        files,
        archiveUrl: this_archive_url,
        turbo: turboDownloads.enabled,
      })
    },
    [archive_url, turboDownloads.enabled]
  )

  useEffect(() => {
    if (stageRef.current === "unstarted") {
      stageRef.current = "started"
      installRequiredFiles(
        requiredFiles.filter(
          ({ status }) =>
            status === "downloadable" ||
            status === "wrong" ||
            status === "at_root" ||
            status === "at_root_match"
        )
      )
    }
  }, [installRequiredFiles, requiredFiles])

  return (
    <div className="update-all__core-progress">
      <h3>Installing Required Files...</h3>
      <Progress
        percent={percent}
        message={lastMessage}
        remainingTime={remainingTime}
      />
    </div>
  )
}

const AutoInstallCore = ({
  coreName,
  platformFiles,
  onFinish,
}: {
  coreName: string
  platformFiles: boolean
  onFinish: () => void
}) => {
  const { installCore } = useInstallCore()
  const download_url = useRecoilValue(DownloadURLSelectorFamily(coreName))
  const [installState, setInstallState] =
    useState<null | InstallZipEventPayload>(null)

  const installStageRef = useRef<
    "unstarted" | "started" | "confirmed" | "finished"
  >("unstarted")

  useEffect(() => {
    const unlisten = listen<InstallZipEventPayload>(
      "install-zip-event",
      ({ payload }) => setInstallState(payload)
    )
    return () => {
      unlisten.then((l) => l())
    }
  }, [setInstallState])

  useEffect(() => {
    const unlisten = listen<{ error?: string }>(
      "install-zip-finished",
      ({ payload }) => {
        installStageRef.current = "finished"
        if (payload.error)
          message(payload.error, { title: "Error", type: "error" })

        setInstallState(null)
        onFinish()
      }
    )
    return () => {
      unlisten.then((l) => l())
    }
  }, [setInstallState, onFinish])

  useEffect(() => {
    if (!download_url || installStageRef.current !== "unstarted") return
    installCore(coreName, download_url)
    installStageRef.current = "started"

    return () => {}
  }, [download_url, coreName, installCore])

  useEffect(() => {
    if (installState && installStageRef.current === "started") {
      installStageRef.current = "confirmed"
      const { files } = installState

      const paths = (files || [])
        .filter(({ path }) => {
          const isRootTxt = !path.includes("/") && path.endsWith(".txt")
          if (!platformFiles)
            return !path.startsWith("Platforms/") && !isRootTxt
          return !isRootTxt
        })
        .map(({ path }) => path)

      emit("install-confirmation", {
        type: "InstallConfirmation",
        paths,
        handle_moved_files: true,
        allow: true,
      })
    }
  }, [installState, platformFiles])

  const progress = useMemo(() => {
    if (!installState) return { value: 0, max: 100 }
    if (installState.progress) return installState.progress
    return { value: 0, max: 100 }
  }, [installState])

  return (
    <div className="update-all__core-progress">
      <h3>Installing Core...</h3>
      <Progress percent={(progress.value / progress.max) * 100} />
    </div>
  )
}

const UpdateListItem = ({
  coreName,
  installedVersion,
  latestVersion,
  updateListItem,
  onChangeUpdate,
  onChangeRequiredFiles,
  onChangePlatformFiles,
}: {
  coreName: string
  installedVersion: string
  latestVersion: string
  updateListItem?: UpdateListItem
  onChangeUpdate: (checked: boolean) => void
  onChangeRequiredFiles: (checked: boolean) => void
  onChangePlatformFiles: (checked: boolean) => void
}) => {
  const mainPlatformId = useRecoilValue(
    CoreMainPlatformIdSelectorFamily(coreName)
  )

  return (
    <div
      key={coreName}
      className={`update-all__list-item ${
        updateListItem === undefined ? "update-all__list-item--no-update" : ""
      }`}
    >
      <div className="update-all__list-item-image">
        <PlatformImage platformId={mainPlatformId} />
      </div>
      <div className="update-all__list-item-name">{coreName}</div>
      <div className="update-all__list-item-version">
        {installedVersion}
        <ArrowIcon />
        {latestVersion}
      </div>

      <label className="update-all__list-item-update">
        <input
          type="checkbox"
          checked={updateListItem !== undefined}
          onChange={({ target }) => onChangeUpdate(target.checked)}
        ></input>
      </label>

      <label className="update-all__list-item-required-files">
        <input
          type="checkbox"
          checked={updateListItem?.requiredFiles || false}
          onChange={({ target }) => onChangeRequiredFiles(target.checked)}
        ></input>
      </label>

      <label className="update-all__list-item-platform-images">
        <input
          type="checkbox"
          checked={updateListItem?.platformFiles || false}
          onChange={({ target }) => onChangePlatformFiles(target.checked)}
        ></input>
      </label>
    </div>
  )
}

const ArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24"
    viewBox="0 -960 960 960"
    width="24"
  >
    <path
      fill="currentColor"
      d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"
    />
  </svg>
)
