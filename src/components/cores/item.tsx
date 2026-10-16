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
import { getCoreFeatures, hasFeatures, passesTagFilters } from "./features"
import { aiCheckAtom } from "../../jotai/cores/atoms"
import Tile from "../ui/Tile"

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
  const aiCheck = useAtomValue(aiCheckAtom)
  const tagInfo = {
    requiresLicense: Boolean(inventoryItem?.releases[0].updaters?.license),
    aiScore: aiCheck[coreName]?.overall_score ?? 0,
  }

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
      otherFn={({
        onlyUpdates,
        category,
        features,
        platform: platformId,
        license,
        maxAi,
      }) => {
        if (!passesTagFilters(tagInfo, { license, maxAi })) return false
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
      <Tile
        onClick={onClick}
        media={
          <PlatformImage
            platformId={mainPlatformId}
            label={core.metadata.shortname}
          />
        }
        title={core.metadata.shortname}
        subtitle={
          <>
            <img className="tile__avatar" src={imageSrc} alt="" />
            {core.metadata.author}
          </>
        }
        meta={core.metadata.version}
        tags={<CoreTags coreName={coreName} installed />}
      />
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

  const config = useAtomValue(PocketSyncConfigSelector)
  const authorImageUrl = `https://openfpga-library.github.io/analogue-pocket/assets/images/authors/${identifier}.png`
  const [author] = identifier.split(".")

  if (config.hidden_cores && config.hidden_cores.includes(identifier))
    return null

  return (
    // Filtered by the list already (`filterNotInstalledCores`), so only
    // matches are rendered
    <Tile
      onClick={onClick}
      media={
        <InventoryPlatformImage platformId={platform_id} label={platform_id} />
      }
      title={platform_id}
      subtitle={
        <>
          <img className="tile__avatar" src={authorImageUrl} alt="" />
          {author}
        </>
      }
      meta={version}
      tags={<CoreTags coreName={identifier} installed={false} />}
    />
  )
}
