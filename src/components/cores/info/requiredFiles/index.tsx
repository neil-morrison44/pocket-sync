import { useMemo } from "react"

import { useTranslation } from "react-i18next"
import "./index.css"
import { WarningIcon } from "./warningIcon"
import { RequiredFileInfoSelectorFamily } from "../../../../recoil/requiredFiles/selectors"
import { useAtomValue } from "jotai"

type RequiredFilesProps = {
  coreName: string
  ignoreInstance?: boolean
  onClick?: () => void
}

export const RequiredFiles = ({ coreName, onClick }: RequiredFilesProps) => {
  const requiredFiles = useAtomValue(RequiredFileInfoSelectorFamily(coreName))
  const { t } = useTranslation("core_info")

  const foundFiles = useMemo(
    () => requiredFiles.filter(({ status }) => status.type === "Exists"),
    [requiredFiles]
  )

  const full = useMemo(
    () => foundFiles.length === requiredFiles.length,
    [foundFiles.length, requiredFiles.length]
  )

  if (requiredFiles.length === 0) return null

  const noFiles = foundFiles.length === 0

  return (
    <div className="core-info__info-row">
      <strong>
        {t("required_files")}
        {":"}
      </strong>
      <div
        className={`required-files required-files--${
          full ? "full" : "missing"
        } ${noFiles ? "required-files--none" : ""}`}
        onClick={onClick}
      >
        {noFiles && <WarningIcon />}

        {t("required_files_count", {
          count: foundFiles.length,
          total: requiredFiles.length,
        })}
      </div>
    </div>
  )
}
