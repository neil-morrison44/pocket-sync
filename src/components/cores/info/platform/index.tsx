import { useMemo } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"
import { PlatformInfoSelectorFamily } from "../../../../recoil/platforms/selectors"
import { currentViewAtom } from "../../../../recoil/view/atoms"
import { PlatformId } from "../../../../types"
import { Link } from "../../../link"

import "./index.css"

const HARD_TO_FIND_THINGS = ["Asteroids", "Genesis", "Dominos", "Green Beret"]

type CorePlatformInfoProps = {
  platformId: PlatformId
}

export const CorePlatformInfo = ({ platformId }: CorePlatformInfoProps) => {
  const { platform } = useRecoilValue(PlatformInfoSelectorFamily(platformId))

  const setViewAndSubview = useSetRecoilState(currentViewAtom)

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
      <strong
        className="cores__platform-info-name"
        title="View / Edit platform info"
      >
        {platform.name}
      </strong>

      <div>{`${platform.manufacturer}, ${platform.year}`}</div>
      <Link className="cores__platform-info-wiki" href={wikiLink}>
        {"Wikipedia"}
      </Link>

      <div
        className="cores__platform-info-edit"
        onClick={() =>
          setViewAndSubview({ view: "Platforms", selected: platformId })
        }
        title="View / Edit platform info"
      >
        {"Edit"}
      </div>
    </div>
  )
}
