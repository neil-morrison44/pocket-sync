import { ReactElement, useCallback, useMemo, useState } from "react"
import { PlatformId } from "../../types"
import { useInstallCore } from "../../hooks/useInstallCore"
import { useRecoilValue } from "recoil"
import { CoresForPlatformSelectorFamily } from "../../recoil/platforms/selectors"
import { DownloadURLSelectorFamily } from "../../recoil/inventory/selectors"
import { usePreventGlobalZipInstallModal } from "../../hooks/usePreventGlobalZipInstall"
import { emit, once } from "@tauri-apps/api/event"
import { RepairIcon } from "./repairIcon"
import { Trans } from "react-i18next"

type RepairButtonProps = {
  error: Error
  onFinishRepair: () => void
}

type RepairableCause = {
  type: "missing_platform"
  platform_id: PlatformId
  repairable: true
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
        <RepairMissingPlatform
          platformId={repairableCause.platform_id}
          onFinishRepair={onFinishRepair}
        />
      )

    default:
      return null
  }
}

const RepairMissingPlatform = ({
  platformId,
  onFinishRepair,
}: {
  platformId: PlatformId
  onFinishRepair: () => void
}): ReactElement | null => {
  const coresForPlatform = useRecoilValue(
    CoresForPlatformSelectorFamily(platformId)
  )

  if (coresForPlatform.length === 0) return null

  return (
    <RepairMissingPlatformInner
      coreName={coresForPlatform[0]}
      platformId={platformId}
      onFinishRepair={onFinishRepair}
    />
  )
}

type RepairMissingPlatformInner = {
  coreName: string
  platformId: PlatformId
  onFinishRepair: () => void
}

// Would be easy to convert this to a generic "missing file" one if more missing file bugs come in
const RepairMissingPlatformInner = ({
  coreName,
  platformId,
  onFinishRepair,
}: RepairMissingPlatformInner): ReactElement | null => {
  const [isRepairing, setIsRepairing] = useState(false)
  usePreventGlobalZipInstallModal()

  const downloadUrl = useRecoilValue(DownloadURLSelectorFamily(coreName))

  const callback = useCallback(async () => {
    setIsRepairing(true)
    await emit("install-core", {
      core_name: coreName,
      zip_url: downloadUrl,
    })

    await (() => {
      let outerResolve: null | ((value: null) => void) = null
      const promise = new Promise((resolve) => (outerResolve = resolve))
      once("install-zip-event", () => outerResolve?.(null))
      return promise
    })()

    await emit("install-confirmation", {
      type: "InstallConfirmation",
      paths: [`platforms/${platformId}.json`],
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
  }, [coreName, platformId, onFinishRepair, setIsRepairing])

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
          values={{ path: `Platforms/${platformId}.json`, coreName }}
          components={{
            pre: <pre style={{ display: "inline" }} />,
            bold: <strong />,
          }}
        ></Trans>
      </div>
    </button>
  )
}
