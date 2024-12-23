import { useMemo } from "react"
import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import {
  DataJSONSelectorFamily,
  WalkDirSelectorFamily,
} from "../../recoil/selectors"
import { useTranslation } from "react-i18next"

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
  const data = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    DataJSONSelectorFamily(coreName)
  )
  const files = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    WalkDirSelectorFamily({ path: `Assets/${platformId}`, extensions })
  )
  const { t } = useTranslation("games")

  const count = useMemo(() => {
    const namedFiles = data.data.data_slots.flatMap((s) =>
      s.filename ? [s.filename] : []
    )

    const nonNamedFiles = files.filter(
      (f) => !namedFiles.some((nf) => f.endsWith(nf))
    )
    return nonNamedFiles.length
  }, [files, data])

  return <div>{t("item.game_count", { count })}</div>
}
