import {
  CoreAuthorImageSelectorFamily,
  CoreInfoSelectorFamily,
  CoreMainPlatformIdSelectorFamily,
} from "../../jotai/selectors"

import { PlatformInfoSelectorFamily } from "../../jotai/platforms/selectors"

import "./index.css"
import { SearchContextSelfHidingConsumer } from "../search/context"
import { InventoryItem } from "../../types"
import { useUpdateAvailable } from "../../hooks/useUpdateAvailable"
import { useInventoryItem } from "../../hooks/useInventoryItem"
import { CorePlatformSelectorFamily } from "../../jotai/inventory/selectors"
import { InventoryPlatformImage, PlatformImage } from "./platformImage"
import { PocketSyncConfigSelector } from "../../jotai/config/selectors"
import { useAtomValue } from "jotai"
import { useMemo } from "react"
import { CoreTags } from "./tags"
import { getCoreFeatures, hasFeatures } from "./features"

type CoreItemProps = {
  coreName: string
  onClick: () => void
}

export const CoreItem = ({ coreName, onClick }: CoreItemProps) => {
  const { core } = useAtomValue(CoreInfoSelectorFamily(coreName))
  const imageSrc = useAtomValue(CoreAuthorImageSelectorFamily(coreName))
  const mainPlatformId = useAtomValue(
    CoreMainPlatformIdSelectorFamily(coreName)
  )
  const { platform } = useAtomValue(PlatformInfoSelectorFamily(mainPlatformId))
  const canUpdate = useUpdateAvailable(coreName)
  const inventoryItem = useInventoryItem(coreName)

  // the inventory knows features of older core.json files that lack them
  const coreFeatures = useMemo(
    () =>
      getCoreFeatures(
        coreName,
        inventoryItem?.releases[0].core.framework ?? core.framework
      ),
    [coreName, inventoryItem, core.framework]
  )

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
      otherFn={({ onlyUpdates, category, features, platform: platformId }) => {
        if (category !== "All") {
          if (platform.category !== category) return false
        }
        if (
          platformId &&
          platformId !== "All" &&
          !core.metadata.platform_ids.includes(platformId)
        )
          return false
        if (!hasFeatures(coreFeatures, features)) return false

        if (!onlyUpdates) return true
        return canUpdate !== null
      }}
    >
      <div className="cores__item" role="button" onClick={onClick}>
        <PlatformImage
          className="cores__platform-image"
          platformId={mainPlatformId}
          label={core.metadata.shortname}
        />

        <div className="cores__info-blurb">
          <div className="cores__info-blurb-name">
            {core.metadata.shortname}
          </div>

          <div className="cores__author-tag">
            <img className="cores__author-tag-image" src={imageSrc} />
            {core.metadata.author}
          </div>

          <div className="cores__version">{core.metadata.version}</div>

          <CoreTags coreName={coreName} installed />
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
  const { id: identifier } = inventoryItem
  const version = inventoryItem.releases[0].core.metadata.version
  const platform_id = inventoryItem.releases[0].core.metadata.platform_ids[0]

  const platform = useAtomValue(CorePlatformSelectorFamily(platform_id))

  const config = useAtomValue(PocketSyncConfigSelector)
  const authorImageUrl = `https://openfpga-library.github.io/analogue-pocket/assets/images/authors/${identifier}.png`
  const [author] = identifier.split(".")

  const coreFeatures = useMemo(
    () => getCoreFeatures(identifier, inventoryItem.releases[0].core.framework),
    [identifier, inventoryItem]
  )

  if (config.hidden_cores && config.hidden_cores.includes(identifier))
    return null

  return (
    <SearchContextSelfHidingConsumer
      fields={[platform_id, identifier, inventoryItem.repository?.owner || ""]}
      otherFn={({ category, features, platform: platformId }) => {
        if (!hasFeatures(coreFeatures, features)) return false
        if (
          platformId &&
          platformId !== "All" &&
          !inventoryItem.releases[0].core.metadata.platform_ids.includes(
            platformId
          )
        )
          return false
        if (category === "All") return true
        return category === platform?.category
      }}
    >
      <div
        className="cores__item cores__item--not-installed"
        role="button"
        onClick={onClick}
      >
        <InventoryPlatformImage
          className="cores__platform-image"
          platformId={platform_id}
          label={platform_id}
        />
        <div className="cores__info-blurb">
          <div className="cores__info-blurb-name">{platform_id}</div>
          <div className="cores__author-tag">
            <img className="cores__author-tag-image" src={authorImageUrl} />
            {author}
          </div>
          <div className="cores__version">{version}</div>
          <CoreTags coreName={identifier} installed={false} />
        </div>
      </div>
    </SearchContextSelfHidingConsumer>
  )
}
