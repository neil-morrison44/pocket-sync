import { useTranslation } from "react-i18next"
import { RequiredFileInfo } from "../../../../types"

type RequiredFileRowProps = {
  info: RequiredFileInfo
  hasArchiveLink: boolean
}

export const RequiredFileRow = ({
  info,
  hasArchiveLink,
}: RequiredFileRowProps) => {
  const { t } = useTranslation("core_info_required_files")

  return (
    <div
      key={info.path + info.filename}
      className={`load-required-files__row load-required-files__row--${
        info.exists && info.status !== "wrong" ? "exists" : "missing"
      }`}
    >
      <div className="load-required-files__row_name">{info.filename}</div>
      <div>{info.path}</div>
      {hasArchiveLink && (
        <div>{t(`file_status.${info.status || "unknown"}`)}</div>
      )}
    </div>
  )
}
