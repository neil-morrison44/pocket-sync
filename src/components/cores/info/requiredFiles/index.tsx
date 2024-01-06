import { useMemo } from "react"
import { useRecoilValue } from "recoil"
import { useTranslation } from "react-i18next"
import "./index.css"
import { RequiredFilesWithStatusSelectorFamily } from "../../../../recoil/archive/selectors"
import { WarningIcon } from "./warningIcon"

type RequiredFilesProps = {
  coreName: string
  ignoreInstance?: boolean
  onClick?: () => void
}

export const RequiredFiles = ({ coreName, onClick }: RequiredFilesProps) => {
  const requiredFiles = useRecoilValue(
    RequiredFilesWithStatusSelectorFamily(coreName)
  )
  const { t } = useTranslation("core_info")

  const foundFiles = useMemo(
    () =>
      requiredFiles.filter(
        ({ exists, status }) => exists && status !== "wrong"
      ),
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
