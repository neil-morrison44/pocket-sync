import {
  PlatformInfoSelectorFamily,
  PlatformIsArchivedSelectorFamily,
} from "../../jotai/platforms/selectors"
import { PlatformId } from "../../types"
import { SearchContextSelfHidingConsumer } from "../search/context"
import { useAtomValue } from "jotai"
import { useTranslation } from "react-i18next"
import { PlatformImage } from "../cores/platformImage"
import Tile from "../ui/Tile"
import Tag, { TagList } from "../ui/Tag"

type PlatformItemProps = {
  id: PlatformId
  onClick: () => void
}

/** A platform card like the core cards: image, name, maker, year, tags. */
export const PlatformItem = ({ id, onClick }: PlatformItemProps) => {
  const { platform } = useAtomValue(PlatformInfoSelectorFamily(id))
  const isArchived = useAtomValue(PlatformIsArchivedSelectorFamily(id))
  const { t } = useTranslation("platforms")

  return (
    <SearchContextSelfHidingConsumer
      fields={[
        platform.name,
        id,
        platform.category ?? "",
        platform.manufacturer,
      ]}
    >
      <Tile
        onClick={onClick}
        media={<PlatformImage platformId={id} label={platform.name} />}
        title={platform.name}
        subtitle={platform.manufacturer}
        meta={platform.year}
        tags={
          <TagList>
            {platform.category && <Tag>{platform.category}</Tag>}
            {isArchived && <Tag icon="archive">{t("archived")}</Tag>}
          </TagList>
        }
      />
    </SearchContextSelfHidingConsumer>
  )
}
