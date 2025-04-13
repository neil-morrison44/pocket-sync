import {
  CoreAuthorImageSelectorFamily,
  CoreInfoSelectorFamily,
  CoreMainPlatformIdSelectorFamily,
} from "../../recoil/selectors"

import { PlatformInfoSelectorFamily } from "../../recoil/platforms/selectors"

import "./index.css"
import { Version } from "./version"
import { SearchContextSelfHidingConsumer } from "../search/context"
import { InventoryItem } from "../../types"
import { useUpdateAvailable } from "../../hooks/useUpdateAvailable"
import { KeyIcon } from "./icons/keyIcon"
import { useTranslation } from "react-i18next"
import { useInventoryItem } from "../../hooks/useInventoryItem"
import {
  CorePlatformSelectorFamily,
  PlatformInventoryImageSelectorFamily,
} from "../../recoil/inventory/selectors"
import { PlatformImage } from "./platformImage"
import { AnalogizerIcon } from "./icons/AnalogizerIcon"
import { PocketSyncConfigSelector } from "../../recoil/config/selectors"
import { useAtomValue } from "jotai"

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
        <PlatformImage
          className="cores__platform-image"
          platformId={mainPlatformId}
        />

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
        {inventoryItem && inventoryItem.releases[0].updaters?.license && (
          <SponsorBanner />
        )}
        {coreName.endsWith("_Analogizer") && (
          <div className="cores__item-analogizer">
            <AnalogizerIcon />
          </div>
        )}
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
  const requires_license = inventoryItem.releases[0].updaters?.license

  const imageUrl = useAtomValue(
    PlatformInventoryImageSelectorFamily(platform_id)
  )

  const platform = useAtomValue(CorePlatformSelectorFamily(platform_id))

  const config = useAtomValue(PocketSyncConfigSelector)
  const authorImageUrl = `https://openfpga-cores-inventory.github.io/analogue-pocket/assets/images/authors/${identifier}.png`
  const [author] = identifier.split(".")

  if (config.hidden_cores && config.hidden_cores.includes(identifier))
    return null

  return (
    <SearchContextSelfHidingConsumer
      fields={[platform_id, identifier, inventoryItem.repository?.owner || ""]}
      otherFn={({ category }) => {
        if (category === "All") return true
        return category === platform?.category
      }}
    >
      <div className="cores__item cores__item--not-installed" onClick={onClick}>
        <img
          className="cores__platform-image"
          src={imageUrl}
          height="165"
          width="521"
        ></img>
        {identifier.endsWith("_Analogizer") && (
          <div className="cores__item-analogizer">
            <AnalogizerIcon />
          </div>
        )}
        <div className="cores__info-blurb">
          <div className="cores__info-blurb-name">{platform_id}</div>
          <div className="version">{version}</div>
          <div className="cores__author-tag">
            <img className="cores__author-tag-image" src={authorImageUrl} />

            {author}
          </div>
          {requires_license && <SponsorBanner />}
        </div>
      </div>
    </SearchContextSelfHidingConsumer>
  )
}

const SponsorBanner = () => {
  const { t } = useTranslation("core_info")
  return (
    <div
      className="cores__item-sponsor-banner"
      title={t("requires_license.all")}
    >
      <KeyIcon />
    </div>
  )
}
