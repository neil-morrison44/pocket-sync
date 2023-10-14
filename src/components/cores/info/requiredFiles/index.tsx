import { useMemo } from "react"
import { useRecoilValue } from "recoil"
import { RequiredFileInfoSelectorFamily } from "../../../../recoil/requiredFiles/selectors"
import { useTranslation } from "react-i18next"
import "./index.css"

type RequiredFilesProps = {
  coreName: string
  ignoreInstance?: boolean
  onClick?: () => void
}

export const RequiredFiles = ({ coreName, onClick }: RequiredFilesProps) => {
  const requiredFiles = useRecoilValue(RequiredFileInfoSelectorFamily(coreName))
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

const WarningIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24"
    viewBox="0 -960 960 960"
    width="24"
  >
    <path
      fill="currentColor"
      d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z"
    />
  </svg>
)
