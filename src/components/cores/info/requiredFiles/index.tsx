import { useMemo } from "react"
import { useRecoilValue } from "recoil"
import { RequiredFileInfoSelectorFamily } from "../../../../recoil/selectors"

import "./index.css"

type RequiredFilesProps = {
  coreName: string
  ignoreInstance?: boolean
  onClick?: () => void
}

export const RequiredFiles = ({
  coreName,
  ignoreInstance,
  onClick,
}: RequiredFilesProps) => {
  const requiredFiles = useRecoilValue(RequiredFileInfoSelectorFamily(coreName))

  const filteredRequiredFiles = useMemo(() => {
    if (!ignoreInstance) return requiredFiles

    return requiredFiles.filter(({ type }) => type !== "instance")
  }, [requiredFiles])

  const foundFiles = useMemo(
    () =>
      filteredRequiredFiles.filter(
        ({ exists, status }) => exists && status !== "wrong"
      ),
    [filteredRequiredFiles]
  )

  const full = useMemo(
    () => foundFiles.length === filteredRequiredFiles.length,
    [filteredRequiredFiles]
  )

  if (filteredRequiredFiles.length === 0) return null

  return (
    <div className="core-info__info-row">
      <strong>{"Required Files:"}</strong>
      <div
        className={`required-files required-files--${
          full ? "full" : "missing"
        }`}
        onClick={onClick}
      >{`${foundFiles.length} / ${filteredRequiredFiles.length} Files`}</div>
    </div>
  )
}
