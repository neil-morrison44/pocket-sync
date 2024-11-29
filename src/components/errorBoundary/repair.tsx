import React, { ReactElement, useCallback, useMemo, useState } from "react"
import { PlatformId } from "../../types"
import { useInstallCore } from "../../hooks/useInstallCore"
import { useRecoilValue } from "recoil"
import { CoresForPlatformSelectorFamily } from "../../recoil/platforms/selectors"
import { DownloadURLSelectorFamily } from "../../recoil/inventory/selectors"
import { usePreventGlobalZipInstallModal } from "../../hooks/usePreventGlobalZipInstall"
import { emit, once } from "@tauri-apps/api/event"
import { RepairIcon } from "./repairIcon"
import { Trans } from "react-i18next"
import { githubTokenAtom } from "../../recoil/settings/atoms"

const CORE_FILE_REGEX = /Cores[\/\\]([^\/\\]+)[\/\\]/
const PLATFORM_FILE_REGEX = /Platforms[\/\\]([^\/\\]+)\.json/

type RepairButtonProps = {
  error: Error
  onFinishRepair: () => void
}

type RepairableCause =
  | {
      type: "missing_platform"
      platform_id: PlatformId
      repairable: true
    }
  | {
      repairable: true
      type: "json_error"
      path: string
    }

export const RepairButton = ({
  error,
  onFinishRepair,
}: RepairButtonProps): ReactElement | null => {
  const { installCore } = useInstallCore()

  const repairableCause: RepairableCause | null = useMemo(() => {
    if (
      error.cause &&
      //@ts-ignore
      error.cause.repairable
    ) {
      return error.cause as RepairableCause
    }
    return null
  }, [])

  if (!repairableCause) return null

  switch (repairableCause.type) {
    case "missing_platform":
      return (
        <GetCoresForPlatform platformId={repairableCause.platform_id}>
          {(coreName) => (
            <GetDownloadURLForCore coreName={coreName}>
              {(downloadUrl) => (
                <RepairRedownloadFiles
                  coreName={coreName}
                  downloadUrl={downloadUrl}
                  paths={[`platforms/${repairableCause.platform_id}.json`]}
                  onFinishRepair={onFinishRepair}
                />
              )}
            </GetDownloadURLForCore>
          )}
        </GetCoresForPlatform>
      )
    case "json_error": {
      const path = repairableCause.path

      if (path.startsWith("Cores")) {
        const coreMatch = path.match(CORE_FILE_REGEX)
        if (!coreMatch) return null
        const coreName = coreMatch[1]

        return (
          <GetDownloadURLForCore coreName={coreName}>
            {(downloadUrl) => (
              <RepairRedownloadFiles
                coreName={coreName}
                downloadUrl={downloadUrl}
                paths={[path]}
                onFinishRepair={onFinishRepair}
              />
            )}
          </GetDownloadURLForCore>
        )
      } else if (path.startsWith("Platforms")) {
        const platformMatch = path.match(PLATFORM_FILE_REGEX)
        if (!platformMatch) return null
        const platformId = platformMatch[1]

        return (
          <GetCoresForPlatform platformId={platformId}>
            {(coreName) => (
              <GetDownloadURLForCore coreName={coreName}>
                {(downloadUrl) => (
                  <RepairRedownloadFiles
                    coreName={coreName}
                    downloadUrl={downloadUrl}
                    paths={[`platforms/${platformId}.json`]}
                    onFinishRepair={onFinishRepair}
                  />
                )}
              </GetDownloadURLForCore>
            )}
          </GetCoresForPlatform>
        )
      }
      return null
    }

    default:
      return null
  }
}

type GetCoresForPlatformProps = {
  platformId: PlatformId
  children: (coreName: string) => ReactElement
}

const GetCoresForPlatform = ({
  children,
  platformId,
}: GetCoresForPlatformProps): ReactElement | null => {
  const coresForPlatform = useRecoilValue(
    CoresForPlatformSelectorFamily(platformId)
  )

  return (
    <>
      {coresForPlatform.map((coreName) => (
        <React.Fragment key={coreName}>{children(coreName)}</React.Fragment>
      ))}
    </>
  )
}

type GetDownloadURLForCoreProps = {
  coreName: string
  children: (downloadUrl: string) => ReactElement
}

const GetDownloadURLForCore = ({
  children,
  coreName,
}: GetDownloadURLForCoreProps): ReactElement | null => {
  const downloadUrl = useRecoilValue(DownloadURLSelectorFamily(coreName))

  if (!downloadUrl) return null
  return <>{children(downloadUrl)}</>
}

type RepairRedownloadFilesProps = {
  coreName: string
  downloadUrl: string
  paths: string[]
  onFinishRepair: () => void
}

// Would be easy to convert this to a generic "missing file" one if more missing file bugs come in
const RepairRedownloadFiles = ({
  coreName,
  downloadUrl,
  paths,
  onFinishRepair,
}: RepairRedownloadFilesProps): ReactElement | null => {
  const [isRepairing, setIsRepairing] = useState(false)
  const githubToken = useRecoilValue(githubTokenAtom)
  usePreventGlobalZipInstallModal()

  const callback = useCallback(async () => {
    setIsRepairing(true)
    await emit("install-core", {
      core_name: coreName,
      zip_url: downloadUrl,
      github_token: githubToken.value,
    })

    await (() => {
      let outerResolve: null | ((value: null) => void) = null
      const promise = new Promise((resolve) => (outerResolve = resolve))
      once("install-zip-event", () => outerResolve?.(null))
      return promise
    })()

    await emit("install-confirmation", {
      type: "InstallConfirmation",
      paths,
      handle_moved_files: false,
      allow: true,
    })

    await (() => {
      let outerResolve: null | ((value: null) => void) = null
      const promise = new Promise((resolve) => (outerResolve = resolve))
      once("install-zip-finished", () => outerResolve?.(null))
      return promise
    })()

    await new Promise((resolve) => window.setTimeout(resolve, 2e3))

    onFinishRepair()
  }, [coreName, paths, onFinishRepair, setIsRepairing])

  if (!downloadUrl) return null

  if (isRepairing) {
    return (
      <button className="error-boundary__repair-button">
        <div className="error-boundary__repair-button-title error-boundary__repair-button-title--in-progress">
          <RepairIcon />
          <Trans i18nKey="error:repair:in_progress"></Trans>
        </div>
      </button>
    )
  }

  return (
    <button onClick={callback} className="error-boundary__repair-button">
      <div className="error-boundary__repair-button-title">
        <RepairIcon />
        <Trans i18nKey="error:repair:title"></Trans>
      </div>
      <div>
        <Trans
          i18nKey="error:repair:fixes:redownload_file"
          values={{ path: paths.join(", "), coreName }}
          components={{
            pre: <pre style={{ display: "inline" }} />,
            bold: <strong />,
          }}
        ></Trans>
      </div>
    </button>
  )
}
