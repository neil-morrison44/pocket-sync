import React from "react"
import { useRecoilValue } from "recoil"
import { FirmwareDetailsSelectorFamily } from "../../../recoil/firmware/selectors"

import "./index.css"
import { Link } from "../../link"

type FirmwareReleaseNotesProp = {
  version: string
}

export const FirmwareReleaseNotes = ({ version }: FirmwareReleaseNotesProp) => {
  const firmwareDetails = useRecoilValue(
    FirmwareDetailsSelectorFamily({ version })
  )

  return (
    <div className="firmware-release-notes">
      <h1>{`v${version} Release Notes:`}</h1>
      <div className="firmware-release-notes__link">
        From{" "}
        <Link
          href={`https://www.analogue.co/support/pocket/firmware/${version}`}
        >
          {`https://www.analogue.co/support/pocket/firmware/${version}`}
        </Link>
      </div>
      <div
        className="firmware-release-notes__content"
        dangerouslySetInnerHTML={{ __html: firmwareDetails.release_notes_html }}
      ></div>
    </div>
  )
}
