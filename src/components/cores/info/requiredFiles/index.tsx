import { useMemo } from "react"
import { useRecoilValue } from "recoil"
import { RequiredFileInfoSelectorFamily } from "../../../../recoil/selectors"

import "./index.css"

type RequiredFilesProps = {
  coreName: string
  ignoreInstance?: boolean
}

export const RequiredFiles = ({
  coreName,
  ignoreInstance,
}: RequiredFilesProps) => {
  const requiredFiles = useRecoilValue(RequiredFileInfoSelectorFamily(coreName))

  const filteredRequiredFiles = useMemo(() => {
    if (!ignoreInstance) return requiredFiles

    return requiredFiles.filter(({ type }) => type !== "instance")
  }, [requiredFiles])

  const foundFiles = useMemo(
    () => filteredRequiredFiles.filter(({ exists }) => exists),
    [filteredRequiredFiles]
  )

  const full = useMemo(
    () => filteredRequiredFiles.every(({ exists }) => exists),
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
      >{`${foundFiles.length} / ${filteredRequiredFiles.length} Files`}</div>
    </div>
  )
}
