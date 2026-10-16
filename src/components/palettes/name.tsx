import { Fragment } from "react"
import { splitAsPath } from "../../utils/splitAsPath"

/**
 * A palette's name, with the folders it's in before it ("folder / name");
 * `hideFolders` when a group header already shows them.
 */
export const PaletteName = ({
  name,
  hideFolders = false,
}: {
  name: string
  hideFolders?: boolean
}) => {
  const chunks = splitAsPath(name.replace(".pal", ""))
  return (
    <div className="palettes__name">
      {(hideFolders ? chunks.slice(-1) : chunks).map((chunk, index) => {
        return (
          <Fragment key={index}>
            {index > 0 && " / "}
            {chunk}
          </Fragment>
        )
      })}
    </div>
  )
}
