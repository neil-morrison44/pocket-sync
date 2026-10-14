import { useTranslation } from "react-i18next"
import { DataSlotFile } from "../../../../types"
import prettyBytes from "pretty-bytes"
import Tag, { TagTheme } from "../../../ui/Tag"
import { IconOptions } from "../../../ui/Icon"

type RequiredFileRowProps = {
  info: DataSlotFile
}

/** How each status reads: green when the file is there, red when it can't be found. */
const STATUS_TAGS: Record<
  DataSlotFile["status"]["type"],
  { theme: TagTheme; icon?: IconOptions }
> = {
  Exists: { theme: "accent", icon: "check" },
  FoundAtRoot: { theme: "accent", icon: "check" },
  MissingButOnArchive: { theme: "neutral", icon: "download" },
  NeedsUpdateFromArchive: { theme: "warning", icon: "upload" },
  RootNeedsUpdate: { theme: "warning", icon: "warning-diamond" },
  NotFound: { theme: "danger", icon: "warning-diamond" },
  NotChecked: { theme: "neutral" },
}

export const RequiredFileRow = ({ info }: RequiredFileRowProps) => {
  const { t } = useTranslation("core_info_required_files")
  const tag = STATUS_TAGS[info.status.type] ?? { theme: "neutral" }

  return (
    <div
      key={info.path + info.name}
      className={`load-required-files__row load-required-files__row--${
        info.status.type === "Exists" ? "exists" : "missing"
      }`}
    >
      <div className="load-required-files__row-name">{info.name}</div>
      <div className="load-required-files__row-size">
        {(info.status.type === "MissingButOnArchive" ||
          info.status.type === "NeedsUpdateFromArchive") &&
          info.status.size &&
          prettyBytes(parseInt(info.status.size))}
      </div>
      <div className="load-required-files__row-path">{info.path}</div>
      <div>
        <Tag theme={tag.theme} icon={tag.icon}>
          {t(`file_status.${camelToSnakeCase(info.status.type)}`)}
        </Tag>
      </div>
    </div>
  )
}

const camelToSnakeCase = (str: string) =>
  str
    .split(/(?=[A-Z])/)
    .join("_")
    .toLowerCase()
