import { Fragment } from "react"
import { splitAsPath } from "../../utils/splitAsPath"

export const PaletteName = ({ name }: { name: string }) => {
  return (
    <div className="palettes__name">
      {splitAsPath(name.replace(".pal", "")).map((chunk, index) => {
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
