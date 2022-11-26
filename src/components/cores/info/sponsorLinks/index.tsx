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
      {sponsorTypes.flatMap((sponsorKey) => {
        const l = links[sponsorKey]
        const linksArray = Array.isArray(l) ? l : [l]
        return linksArray.map((link) => (
          <Link className="sponsor-links__link" key={link} href={link}>
            {link}
          </Link>
        ))
      })}
    </div>
  )
}
