import {
  PlatformInfoSelectorFamily,
  PlatformIsArchivedSelectorFamily,
} from "../../jotai/platforms/selectors"
import { PlatformId } from "../../types"
import { SearchContextSelfHidingConsumer } from "../search/context"
import { useAtomValue } from "jotai"
import { useTranslation } from "react-i18next"
import { PlatformImage } from "../cores/platformImage"
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
      <div className="cores__item" role="button" onClick={onClick}>
        <PlatformImage
          className="cores__platform-image"
          platformId={id}
          label={platform.name}
        />
        <div className="cores__info-blurb">
          <div className="cores__info-blurb-name">{platform.name}</div>
          <div className="cores__author-tag">{platform.manufacturer}</div>
          <div className="cores__version">{platform.year}</div>
          <TagList>
            {platform.category && <Tag>{platform.category}</Tag>}
            {isArchived && <Tag icon="archive">{t("archived")}</Tag>}
          </TagList>
        </div>
      </div>
    </SearchContextSelfHidingConsumer>
  )
}
