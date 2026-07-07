import { useMemo } from "react"

import {
  PlatformImageSelectorFamily,
  PlatformInfoSelectorFamily,
  PlatformIsArchivedSelectorFamily,
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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="currentColor"
      >
        <path d="M200-80q-33 0-56.5-23.5T120-160v-451q-18-11-29-28.5T80-680v-120q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v120q0 23-11 40.5T840-611v451q0 33-23.5 56.5T760-80H200Zm0-520v440h560v-440H200Zm-40-80h640v-120H160v120Zm200 280h240v-80H360v80Zm120 20Z" />
      </svg>
    </div>
  )
}
