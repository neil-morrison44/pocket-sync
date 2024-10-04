import { useMemo } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"
import {
  PlatformExistsSelectorFamily,
  PlatformInfoSelectorFamily,
} from "../../../../recoil/platforms/selectors"
import { currentViewAtom } from "../../../../recoil/view/atoms"
import { PlatformId } from "../../../../types"
import { Link } from "../../../link"
import { useTranslation } from "react-i18next"

import "./index.css"

const HARD_TO_FIND_THINGS = [
  "Asteroids",
  "Genesis",
  "Dominos",
  "Green Beret",
  "Lynx",
]

type CorePlatformInfoProps = {
  platformId: PlatformId
}

export const CorePlatformInfo = ({ platformId }: CorePlatformInfoProps) => {
  const fileExists = useRecoilValue(PlatformExistsSelectorFamily(platformId))

  if (fileExists) return <CorePlatformInfoExists platformId={platformId} />

  return (
    <div className="cores__platform-info cores__platform-info--non-existent">
      {platformId}
    </div>
  )
}

export const CorePlatformInfoExists = ({
  platformId,
}: CorePlatformInfoProps) => {
  const { platform } = useRecoilValue(PlatformInfoSelectorFamily(platformId))
  const setViewAndSubview = useSetRecoilState(currentViewAtom)
  const { t } = useTranslation("core_info")

  const wikiLink = useMemo(() => {
    const searchTerm = HARD_TO_FIND_THINGS.includes(platform.name)
      ? `${platform.manufacturer} ${platform.name}`
      : platform.name

    return `https://en.wikipedia.org/wiki/Special:Search?go=Go&search=${window.encodeURIComponent(
      searchTerm
    )}`
  }, [platform])

  return (
    <div className="cores__platform-info">
      <div className="cores__platform-info-cateogry">{platform.category}</div>
      <strong className="cores__platform-info-name">{platform.name}</strong>

      <div>{[platform.manufacturer, platform.year].join(", ")}</div>
      <Link className="cores__platform-info-wiki" href={wikiLink}>
        {t("platform.wikipedia")}
      </Link>

      <div
        className="cores__platform-info-edit"
        onClick={() =>
          setViewAndSubview({ view: "Platforms", selected: platformId })
        }
      >
        {t("platform.edit")}
      </div>
    </div>
  )
}
