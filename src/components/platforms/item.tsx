import { useMemo } from "react"

import {
  PlatformImageSelectorFamily,
  PlatformInfoSelectorFamily,
  PlatformIsArchivedSelectorFamily,
} from "../../jotai/platforms/selectors"
import { PlatformId } from "../../types"
import { SearchContextSelfHidingConsumer } from "../search/context"
import { useAtomValue } from "jotai"
import Icon from "../ui/Icon"

type PlatformItemProps = {
  id: PlatformId
  onClick: () => void
}

export const PlatformItem = ({ id, onClick }: PlatformItemProps) => {
  const { platform } = useAtomValue(PlatformInfoSelectorFamily(id))
  const platformImage = useAtomValue(PlatformImageSelectorFamily(id))
  const isArchived = useAtomValue(PlatformIsArchivedSelectorFamily(id))

  const category = useMemo(
    () => platform.category || "Uncategorised",
    [platform.category]
  )

  return (
    <SearchContextSelfHidingConsumer
      fields={[platform.name, id, category, platform.manufacturer]}
    >
      <div className="cores__item" role="button" onClick={onClick}>
        {isArchived && <ArchiveIcon />}
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

const ArchiveIcon = () => {
  return (
    <div className="cores__item-archive-icon">
      <Icon icon="archive" />
    </div>
  )
}
