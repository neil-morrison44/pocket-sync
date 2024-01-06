import { useRecoilValue } from "recoil"
import { FirmwareDetailsSelectorFamily } from "../../../recoil/firmware/selectors"
import { useTranslation } from "react-i18next"
import parse, { Element, domToReact } from "html-react-parser"

import "./index.css"
import { Link } from "../../link"

type FirmwareReleaseNotesProp = {
  version: string
}

export const FirmwareReleaseNotes = ({ version }: FirmwareReleaseNotesProp) => {
  const firmwareDetails = useRecoilValue(
    FirmwareDetailsSelectorFamily({ version })
  )
  const { t } = useTranslation("firmware")
  const url = `https://www.analogue.co/support/pocket/firmware/${version}`

  return (
    <div className="firmware-release-notes">
      <h1>{t("release_notes.title", { version })}</h1>
      <div className="firmware-release-notes__link">
        {t("release_notes.from")}
        <Link href={url}>{url}</Link>
      </div>
      <div className="firmware-release-notes__content">
        {parse(firmwareDetails.release_notes_html, {
          replace(domNode) {
            if (domNode instanceof Element && domNode.name === "a") {
              return (
                <Link href={domNode.attribs.href || undefined}>
                  {/* @ts-ignore */}
                  {domToReact(domNode.childNodes)}
                </Link>
              )
            }
          },
        })}
      </div>
    </div>
  )
}
