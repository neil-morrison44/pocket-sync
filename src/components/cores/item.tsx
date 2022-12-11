import { useRecoilValue } from "recoil"
import {
  CoreAuthorImageSelectorFamily,
  CoreInfoSelectorFamily,
} from "../../recoil/selectors"

import { PlatformInfoSelectorFamily } from "../../recoil/platforms/selectors"
import { PlatformImage } from "./platformImage"

import "./index.css"
import { Version } from "./version"
import { SearchContextSelfHidingConsumer } from "../search/context"
import { InventoryItem } from "../../types"
import { useUpdateAvailable } from "../../hooks/useUpdateAvailable"
import { useCallback } from "react"

type CoreItemProps = {
  coreName: string
  onClick: () => void
}

export const CoreItem = ({ coreName, onClick }: CoreItemProps) => {
  const { core } = useRecoilValue(CoreInfoSelectorFamily(coreName))
  const imageSrc = useRecoilValue(CoreAuthorImageSelectorFamily(coreName))
  const { platform } = useRecoilValue(
    PlatformInfoSelectorFamily(core.metadata.platform_ids[0])
  )

  const canUpdate = useUpdateAvailable(coreName)

  return (
    <SearchContextSelfHidingConsumer
      fields={[
        core.metadata.shortname,
        core.metadata.author,
        platform.manufacturer,
        platform.name,
        platform.category || "",
        `${platform.year}`,
      ]}
      otherFn={({ onlyUpdates, category }) => {
        if (category !== "All") {
          if (platform.category !== category) return false
        }

        if (!onlyUpdates) return true
        return canUpdate !== null
      }}
    >
      <div className="cores__item" role="button" onClick={onClick}>
        {core.metadata.platform_ids.map((platformId) => (
          <PlatformImage
            className="cores__platform-image"
            platformId={platformId}
            key={platformId}
          />
        ))}

        <div className="cores__info-blurb">
          <div className="cores__info-blurb-name">
            {core.metadata.shortname}
          </div>

          <Version coreName={coreName} />

          <div className="cores__author-tag">
            <img className="cores__author-tag-image" src={imageSrc} />
            {core.metadata.author}
          </div>
        </div>
      </div>
    </SearchContextSelfHidingConsumer>
  )
}

type NotInstalledCoreItemProps = {
  inventoryItem: InventoryItem
  onClick: () => void
}

export const NotInstalledCoreItem = ({
  inventoryItem,
  onClick,
}: NotInstalledCoreItemProps) => {
  const { platform, identifier } = inventoryItem

  return (
    <SearchContextSelfHidingConsumer
      fields={[platform, identifier, inventoryItem.repository?.owner || ""]}
      otherFn={({ category }) => {
        if (category === "All") return true
        const aRelease = inventoryItem?.release || inventoryItem?.prerelease
        return category === aRelease?.platform.category
      }}
    >
      <div className="cores__item cores__item--not-installed" onClick={onClick}>
        <div>{platform}</div>
        <div className="cores__not-installed-item-id">{identifier}</div>
      </div>
    </SearchContextSelfHidingConsumer>
  )
}
