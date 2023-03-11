import { useState } from "react"
import { useRecoilValue } from "recoil"
import { PocketSyncConfigSelector } from "../../recoil/selectors"
import { Link } from "../link"
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
      <div className="settings__items">
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
          <div className="settings__text-input-and-save">
            <input
              type="text"
              className="settings__text-input"
              value={archiveUrlInput}
              onChange={({ target }) => setArchiveUrl(target.value)}
            />
            <button
              onClick={() => updateConfig("archive_url", archiveUrlInput)}
            >
              {"Save"}
            </button>
          </div>
        </div>
      </div>

      <div className="settings__info">
        <h3>Thanks to:</h3>

        <ul>
          <li>
            <Link href={"https://github.com/openfpga-cores-inventory"}>
              {"https://github.com/openfpga-cores-inventory"}
            </Link>
          </li>

          <li>
            <Link href={"https://github.com/AbFarid/analogue-os-font"}>
              {"https://github.com/AbFarid/analogue-os-font"}
            </Link>
          </li>

          <li>
            <Link
              href={
                "https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky"
              }
            >
              {"3D Pocket reflection map from Poly Haven"}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
