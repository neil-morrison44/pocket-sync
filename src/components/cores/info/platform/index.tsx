import { useMemo } from "react"
import { useRecoilValue } from "recoil"
import { PlatformInfoSelectorFamily } from "../../../../recoil/selectors"
import { PlatformId } from "../../../../types"
import { Link } from "../../../link"

import "./index.css"

const HARD_TO_FIND_THINGS = ["Genesis", "Dominos", "Green Beret"]

type CorePlatformInfoProps = {
  platformId: PlatformId
}

export const CorePlatformInfo = ({ platformId }: CorePlatformInfoProps) => {
  const { platform } = useRecoilValue(PlatformInfoSelectorFamily(platformId))

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

      <div>{`${platform.manufacturer}, ${platform.year}`}</div>
      <Link className="cores__platform-info-wiki" href={wikiLink}>
        {"Wikipedia"}
      </Link>
    </div>
  )
}
