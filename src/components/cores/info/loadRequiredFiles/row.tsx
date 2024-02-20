import { useTranslation } from "react-i18next"
import { DataSlotFile } from "../../../../types"

type RequiredFileRowProps = {
  info: DataSlotFile
  hasArchiveLink: boolean
}

export const RequiredFileRow = ({
  info,
  hasArchiveLink,
}: RequiredFileRowProps) => {
  const { t } = useTranslation("core_info_required_files")

  return (
    <div
      key={info.path + info.name}
      className={`load-required-files__row load-required-files__row--${
        info.status.type === "Exists" ? "exists" : "missing"
      }`}
    >
      <div className="load-required-files__row_name">{info.name}</div>
      <div>{info.path}</div>
      {hasArchiveLink && (
        <div>{t(`file_status.${camelToSnakeCase(info.status.type)}`)}</div>
      )}
    </div>
  )
}

const camelToSnakeCase = (str: string) =>
  str
    .split(/(?=[A-Z])/)
    .join("_")
    .toLowerCase()
