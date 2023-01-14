import { useMemo } from "react"
import { useRecoilValue } from "recoil"
import { RequiredFileInfoSelectorFamily } from "../../../../recoil/selectors"

import "./index.css"

type RequiredFilesProps = {
  coreName: string
  ignoreInstance?: boolean
  onClick?: () => void
}

export const RequiredFiles = ({ coreName, onClick }: RequiredFilesProps) => {
  const requiredFiles = useRecoilValue(RequiredFileInfoSelectorFamily(coreName))

  const foundFiles = useMemo(
    () =>
      requiredFiles.filter(
        ({ exists, status }) => exists && status !== "wrong"
      ),
    [requiredFiles]
  )

  const full = useMemo(
    () => foundFiles.length === requiredFiles.length,
    [requiredFiles]
  )

  if (requiredFiles.length === 0) return null

  return (
    <div className="core-info__info-row">
      <strong>{"Required Files:"}</strong>
      <div
        className={`required-files required-files--${
          full ? "full" : "missing"
        }`}
        onClick={onClick}
      >{`${foundFiles.length} / ${requiredFiles.length} Files`}</div>
    </div>
  )
}
