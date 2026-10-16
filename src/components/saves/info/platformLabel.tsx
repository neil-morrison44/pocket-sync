import {
  PlatformExistsSelectorFamily,
  PlatformInfoSelectorFamily,
} from "../../../jotai/platforms/selectors"
import { PlatformId } from "../../../types"
import { useAtomValue, useSetAtom } from "jotai"
import { startTransition } from "react"
import { Link } from "../../link"
import { currentViewAtom } from "../../../jotai/view/atoms"

/**
 * The platform's name above its saves. Save folders are named by platform
 * ID, and the card may have no platform file for one (e.g. "gbc" without a
 * Game Boy Color core), so it falls back to the folder's name.
 */
export const PlatformLabel = ({ id }: { id: PlatformId }) => {
  const exists = useAtomValue(PlatformExistsSelectorFamily(id))
  const setView = useSetAtom(currentViewAtom)
  return (
    <div className="saves__info-save-files-platform">
      {exists ? (
        // Opens the platform
        <Link
          subtle
          onClick={() =>
            startTransition(() => setView({ view: "Platforms", selected: id }))
          }
        >
          <PlatformName id={id} />
        </Link>
      ) : (
        id
      )}
    </div>
  )
}

const PlatformName = ({ id }: { id: PlatformId }) => {
  const { platform } = useAtomValue(PlatformInfoSelectorFamily(id))
  return platform.name
}
