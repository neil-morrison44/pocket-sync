import { useMemo } from "react"
import { useRecoilValue } from "recoil"
import {
  DataJSONSelectorFamily,
  FileCountSelectorFamily,
  WalkDirSelectorFamily,
} from "../../recoil/selectors"

type GameCountProps = {
  platformId: string
  coreName: string
  extensions: string[]
}

export const GameCount = ({
  platformId,
  coreName,
  extensions,
}: GameCountProps) => {
  const data = useRecoilValue(DataJSONSelectorFamily(coreName))
  const files = useRecoilValue(
    WalkDirSelectorFamily({ path: `Assets/${platformId}`, extensions })
  )

  const count = useMemo(() => {
    const namedFiles = data.data.data_slots.flatMap((s) =>
      s.filename ? [s.filename] : []
    )

    const nonNamedFiles = files.filter(
      (f) => !namedFiles.some((nf) => f.endsWith(nf))
    )
    return nonNamedFiles.length
  }, [files, data, extensions])

  return <div>{`${count.toLocaleString()} Games`}</div>
}
