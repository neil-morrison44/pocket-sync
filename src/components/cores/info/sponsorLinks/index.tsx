import { useMemo } from "react"
import { InventoryItem } from "../../../../types"
import { Link } from "../../../link"

import "./index.css"

type SponsorLinkProps = {
  links: Required<InventoryItem>["sponsor"]
}

export const SponsorLinks = ({ links }: SponsorLinkProps) => {
  const sponsorTypes = useMemo(() => Object.keys(links || {}), [links])

  return (
    <div className="sponsor-links">
      {sponsorTypes.map((sponsorKey) => (
        <Link
          className="sponsor-links__link"
          key={sponsorKey}
          href={links[sponsorKey]}
        >
          {links[sponsorKey]}
        </Link>
      ))}
    </div>
  )
}
