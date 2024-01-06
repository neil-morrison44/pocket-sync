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
import { NotInstalledCoreInfo } from "../info/notInstalled"
import { Loader } from "../../loader"
import { PlatformInfoSelectorFamily } from "../../../recoil/platforms/selectors"
import { AutoInstallCore } from "./autoInstallCore"
import { AutoInstallFiles } from "./autoInstallFiles"
import { useTranslation } from "react-i18next"
import { message } from "@tauri-apps/api/dialog"
import { useHasArchiveLink } from "../../../hooks/useHasArchiveLink"

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
  const { t } = useTranslation("update_all")
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

  useEffect(() => {
    if (stage === null && hasDoneAnUpdateRef.current) {
      onClose()
      return
    }
    if (stage !== null) hasDoneAnUpdateRef.current = true
  }, [onClose, stage])

  const coreCount = useMemo(() => {
    const updateListIndex = updateList.findIndex(
      ({ coreName }) => stage?.coreName === coreName
    )

    return updateListIndex + 1 || 0
  }, [stage, updateList])

  return (
    <Modal className="update-all">
      <h2>{t("title")}</h2>

      {stage === null && (
        <>
          <div className="update-all__list-item">
            <label
              className="update-all__list-item-update"
              onClick={() => setUpdateList([])}
            >
              {t("heading.update")}
            </label>

            <label
              className="update-all__list-item-required-files"
              onClick={() =>
                setUpdateList((ul) =>
                  ul.map((u) => ({ ...u, requiredFiles: false }))
                )
              }
            >
              {t("heading.required_files")}
            </label>

            <label
              className="update-all__list-item-platform-files"
              onClick={() =>
                setUpdateList((ul) =>
                  ul.map((u) => ({ ...u, platformFiles: false }))
                )
              }
            >
              {t("heading.platform_files")}
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
              {t("buttons.update", { count: updateList.length })}
            </button>
          )}
          <button onClick={onClose}>{t("buttons.close")}</button>
        </>
      )}

      {stage && (
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
  const { t } = useTranslation("")
  const unsortedCoresList = useRecoilValue(installedCoresWithUpdatesSelector)

  const coresList = useMemo(
    () =>
      [...unsortedCoresList].sort((a, b) =>
        a.coreName.localeCompare(b.coreName)
      ),
    [unsortedCoresList]
  )

  const hasArchiveLink = useHasArchiveLink()

  useEffect(() => {
    setUpdateList(
      coresList.map(({ coreName }) => ({
        coreName,
        requiredFiles: hasArchiveLink,
        platformFiles: true,
      }))
    )
  }, [coresList, setUpdateList, hasArchiveLink])

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
