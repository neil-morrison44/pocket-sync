import { useRecoilCallback, useRecoilValue } from "recoil"
import { Modal } from "../../modal"
import {
  Dispatch,
  SetStateAction,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import "./index.css"
import { installedCoresWithUpdatesSelector } from "../../../recoil/cores/selectors"
import { CoreMainPlatformIdSelectorFamily } from "../../../recoil/selectors"
import { PlatformImage } from "../platformImage"
import { NotInstalledCoreInfo } from "../info/notInstalled"
import { Loader } from "../../loader"
import { PlatformInfoSelectorFamily } from "../../../recoil/platforms/selectors"
import { CoreInstallProgress } from "./coreInstallProgress"
import { FileInstallProgress } from "./fileInstallProgress"
import { useTranslation } from "react-i18next"
import { message } from "@tauri-apps/plugin-dialog"
import { useHasArchiveLink } from "../../../hooks/useHasArchiveLink"
import { info } from "tauri-plugin-log-api"
import { useProcessUpdates } from "./hooks"
import { usePreventGlobalZipInstallModal } from "../../../hooks/usePreventGlobalZipInstall"
import { keepPlatformDataAtom } from "../../../recoil/settings/atoms"
import { JobsStopButton } from "../../jobs/stop"
import { StopButton } from "../../jobs/button"

type UpdateAllProps = {
  onClose: () => void
}

type UpdateListItem = {
  coreName: string
  update: boolean
  requiredFiles: boolean
  platformFiles: boolean
}

export const UpdateAll = ({ onClose }: UpdateAllProps) => {
  const [updateList, setUpdateList] = useState<UpdateListItem[]>([])
  const { t } = useTranslation("update_all")
  const hasDoneAnUpdateRef = useRef(false)

  usePreventGlobalZipInstallModal()

  const filteredUpdateList = useMemo(
    () => updateList.filter(({ update }) => update),
    [updateList]
  )

  const { processUpdates, stage, abortController } = useProcessUpdates()

  useEffect(() => {
    info(`Update All ${stage ? `${stage.coreName} - ${stage.step}` : "null"}`)
    if (stage === null && hasDoneAnUpdateRef.current) {
      onClose()
      return
    }
    if (stage !== null) hasDoneAnUpdateRef.current = true
  }, [onClose, stage])

  const coreCount = useMemo(() => {
    const updateListIndex = filteredUpdateList.findIndex(
      ({ coreName }) => stage?.coreName === coreName
    )

    return updateListIndex + 1 || 0
  }, [stage, filteredUpdateList])

  const checkStatus = useMemo(() => {
    return {
      updates: getStatusForList(updateList, "update"),
      requiredFiles: getStatusForList(updateList, "requiredFiles"),
      platformFiles: getStatusForList(updateList, "platformFiles"),
    }
  }, [updateList])

  return (
    <Modal className="update-all">
      <h2>{t("title")}</h2>

      {stage === null && (
        <>
          <div className="update-all__list-item">
            <label
              className="update-all__list-item-update"
              onClick={() =>
                setUpdateList((ul) =>
                  ul.map((u) => ({
                    ...u,
                    update: checkStatus.updates === "none",
                  }))
                )
              }
            >
              {t("heading.update")}
              <StatusIcon status={checkStatus.updates} />
            </label>

            <label
              className="update-all__list-item-required-files"
              onClick={() =>
                setUpdateList((ul) =>
                  ul.map((u) => ({
                    ...u,
                    requiredFiles: checkStatus.requiredFiles === "none",
                  }))
                )
              }
            >
              {t("heading.required_files")}
              <StatusIcon status={checkStatus.requiredFiles} />
            </label>

            <label
              className="update-all__list-item-platform-files"
              onClick={() =>
                setUpdateList((ul) =>
                  ul.map((u) => ({
                    ...u,
                    platformFiles: checkStatus.platformFiles === "none",
                  }))
                )
              }
            >
              {t("heading.platform_files")}
              <StatusIcon status={checkStatus.platformFiles} />
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
          {filteredUpdateList.length > 0 && (
            <button
              onClick={() => {
                processUpdates(filteredUpdateList)
              }}
            >
              {t("buttons.update", { count: filteredUpdateList.length })}
            </button>
          )}
          <button onClick={onClose}>{t("buttons.close")}</button>
        </>
      )}

      {stage && (
        <>
          <div className="update-all__step-info">
            <h3 className="update-all__step-info-title">
              <span>{t("update.title", { ...stage })}</span>
              {/* eslint-disable-next-line react/jsx-no-literals */}
              <span>{`(${coreCount}/${updateList.length})`}</span>
            </h3>
            <div>
              <Suspense fallback={<Loader className="loader--no-background" />}>
                <NotInstalledCoreInfo
                  coreName={stage.coreName}
                  onBack={() => {}}
                  withoutControls
                  withoutTitle
                />
              </Suspense>
            </div>
            <Suspense fallback={<Loader className="loader--no-background" />}>
              {stage.step === "core" && <CoreInstallProgress />}
              {stage.step === "files" && <FileInstallProgress />}
              {stage.step === "filecheck" && (
                <Loader className="loader--no-background" />
              )}
            </Suspense>
          </div>

          <JobsStopButton
            jobId="install_archive_files"
            onStop={() => abortController.abort()}
            noJobsFallback={() => (
              <StopButton
                onClick={() => abortController.abort()}
                status={abortController.signal.aborted ? "Stopping" : "Running"}
              />
            )}
          />
        </>
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
  const { t } = useTranslation("")
  const unsortedCoresList = useRecoilValue(installedCoresWithUpdatesSelector)
  const keepPlatformData = useRecoilValue(keepPlatformDataAtom)

  const getUpdateList = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const list = await snapshot.getPromise(
          installedCoresWithUpdatesSelector
        )
        setUpdateList(
          list.map(({ coreName }) => ({
            coreName,
            requiredFiles: hasArchiveLink,
            platformFiles: !keepPlatformData.enabled,
            update: true,
          }))
        )
      },
    [setUpdateList, keepPlatformData]
  )

  useEffect(() => {
    getUpdateList()
  }, [getUpdateList])

  const coresList = useMemo(
    () =>
      [...unsortedCoresList].sort((a, b) =>
        a.coreName.localeCompare(b.coreName)
      ),
    [unsortedCoresList]
  )

  const hasArchiveLink = useHasArchiveLink()

  if (coresList.length === 0)
    return (
      <div className="update-all__list">
        <div className="update-all__no-updates">
          {t("update_all:no_updates_found")}
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
            setUpdateList((curr) =>
              curr.map((ui) => {
                if (ui.coreName !== coreName) return ui
                return { ...ui, update: checked }
              })
            )
          }}
          onChangeRequiredFiles={(checked) => {
            if (!hasArchiveLink) {
              message(t("core_info_required_files:no_link_tip"))
              return
            }

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

  const platformInfo = useRecoilValue(
    PlatformInfoSelectorFamily(mainPlatformId)
  )

  if (!updateListItem) return null

  return (
    <div
      key={coreName}
      className={`update-all__list-item ${
        !updateListItem.update ? "update-all__list-item--no-update" : ""
      }`}
    >
      <div className="update-all__list-item-image">
        <PlatformImage platformId={mainPlatformId} />
      </div>
      <div className="update-all__list-item-name">{coreName}</div>
      <div className="update-all__list-item-platform">
        {platformInfo.platform.name}
        {" - "}
        {platformInfo.platform.category}
      </div>
      <div className="update-all__list-item-version">
        {installedVersion}
        <ArrowIcon />
        {latestVersion}
      </div>

      <label className="update-all__list-item-update">
        <input
          type="checkbox"
          checked={updateListItem.update}
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

      <label className="update-all__list-item-platform-files">
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

const StatusIcon = ({ status }: { status: "all" | "some" | "none" }) => (
  <div
    className={`update-all__status-icon update-all__status-icon--${status}`}
  ></div>
)

const getStatusForList = (
  list: UpdateListItem[],
  property: keyof UpdateListItem
): "all" | "some" | "none" => {
  switch (true) {
    case list.every((l) => l[property]):
      return "all"
    case list.some((l) => l[property]):
      return "some"
    default:
      return "none"
  }
}
