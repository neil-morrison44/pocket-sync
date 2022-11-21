import { useRecoilValue } from "recoil"
import { FileCountSelectorFamily } from "../../recoil/selectors"

export const GameCount = ({
  platformId,
  extensions,
}: {
  platformId: string
  extensions: string[]
}) => {
  const count = useRecoilValue(
    FileCountSelectorFamily({ path: `Assets/${platformId}`, extensions })
  )

  return <div>{`${count.toLocaleString()} Games`}</div>
}
