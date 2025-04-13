import { useMemo } from "react"

import {
  PlatformImageSelectorFamily,
  PlatformInfoSelectorFamily,
} from "../../recoil/platforms/selectors"
import { PlatformId } from "../../types"
import { SearchContextSelfHidingConsumer } from "../search/context"
import { useAtomValue } from "jotai"

type PlatformItemProps = {
  id: PlatformId
  onClick: () => void
}

export const PlatformItem = ({ id, onClick }: PlatformItemProps) => {
  const { platform } = useAtomValue(PlatformInfoSelectorFamily(id))
  const platformImage = useAtomValue(PlatformImageSelectorFamily(id))

  const category = useMemo(
    () => platform.category || "Uncategorised",
    [platform.category]
  )

  return (
    <SearchContextSelfHidingConsumer
      fields={[platform.name, category, platform.manufacturer]}
    >
      <div className="cores__item" role="button" onClick={onClick}>
        <img src={platformImage} />
        <div className="cores__info-blurb">
          <strong>{platform.name}</strong>
          <div>{category}</div>
          <div>{platform.manufacturer}</div>
          <div>{platform.year}</div>
        </div>
      </div>
    </SearchContextSelfHidingConsumer>
  )
}
