import { ArchiveFileMetadata, RequiredFileInfo } from "../../../../types"

type RequiredFileRowProps = {
  info: RequiredFileInfo
  hasArchiveLink: boolean
}

const STATUS_TEXT = {
  wrong: "Updatable",
  downloadable: "Downloadable",
  "not-in-archive": "Not in archive",
  ok: "Downloaded",
  unknown: "Unknown",
}

export const RequiredFileRow = ({
  info,
  hasArchiveLink,
}: RequiredFileRowProps) => {
  return (
    <div
      key={info.path + info.filename}
      className={`load-required-files__row load-required-files__row--${
        info.exists && info.status !== "wrong" ? "exists" : "missing"
      }`}
    >
      <div className="load-required-files__row_name">{info.filename}</div>
      <div>{info.path}</div>
      {hasArchiveLink && <div>{STATUS_TEXT[info.status || "unknown"]}</div>}
    </div>
  )
}
