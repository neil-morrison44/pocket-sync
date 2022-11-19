import { useState } from "react"
import { useRecoilValue } from "recoil"
import { PocketSyncConfigSelector } from "../../recoil/selectors"
import { useUpdateConfig } from "./hooks/useUpdateConfig"

import "./index.css"

const ARCHIVE_URL_TEXT = `Please check with your local laws around the downloading of potentially copyrighted (arcade) ROM & BIOS files.
If you are comfortable with this, copy the following url into the input and hit "save".`

export const Settings = () => {
  const config = useRecoilValue(PocketSyncConfigSelector)
  const [archiveUrlInput, setArchiveUrl] = useState(config.archive_url || "")
  const updateConfig = useUpdateConfig()

  return (
    <div className="settings">
      <h2>{"Settings"}</h2>

      <div className="settings__row">
        <h3 className="settings__row-title">{"Pocket Colour:"}</h3>

        <select
          value={config.colour}
          onChange={({ target }) =>
            updateConfig("colour", target.value as "black" | "white")
          }
        >
          <option value="black">{"Black"}</option>
          <option value="white">{"White"}</option>
        </select>
      </div>

      <div className="settings__row">
        <h3 className="settings__row-title">{"ROM & BIOS archive:"}</h3>
        <div className="settings__ramble">{ARCHIVE_URL_TEXT}</div>
        <pre>{"https://archive.org/download/openFPGA-Files"}</pre>
        <input
          type="text"
          className="settings__text-input"
          value={archiveUrlInput}
          onChange={({ target }) => setArchiveUrl(target.value)}
        />
        <button onClick={() => updateConfig("archive_url", archiveUrlInput)}>
          {"Save"}
        </button>
      </div>
    </div>
  )
}
