import { useMemo } from "react"
import { useRecoilValue } from "recoil"
import { useInstallCore } from "../../../hooks/useInstallCore"
import { useInventoryItem } from "../../../hooks/useInventoryItem"
import { DownloadURLSelectorFamily } from "../../../recoil/inventory/selectors"
import { Controls } from "../../controls"
import { Link } from "../../link"
import { Releases } from "./releases"

type NotInstalledCoreInfoProps = {
  onBack: () => void
  coreName: string
}

export const NotInstalledCoreInfo = ({
  coreName,
  onBack,
}: NotInstalledCoreInfoProps) => {
  const inventoryItem = useInventoryItem(coreName)

  const url = useMemo(() => {
    if (inventoryItem?.repository.platform !== "github") return null
    return `https://github.com/${inventoryItem.repository.owner}/${inventoryItem.repository.name}`
  }, [inventoryItem])

  const download_url = useRecoilValue(DownloadURLSelectorFamily(coreName))
  const { installCore } = useInstallCore()

  return (
    <div className="core-info">
      <Controls
        controls={[
          {
            type: "back-button",
            text: "Back to list",
            onClick: onBack,
          },
          download_url && {
            type: "button",
            text: "Install",
            onClick: () => {
              installCore(coreName, download_url)
            },
          },
        ]}
      />

      {!inventoryItem && <div>{`${coreName} not in cores inventory`}</div>}

      {inventoryItem && (
        <>
          <h3 className="core-info__title">{inventoryItem.platform}</h3>
          <div className="core-info__info">
            <div className="core-info__info-row">
              {inventoryItem.identifier}
            </div>

            {url && (
              <div className="core-info__info-row">
                <strong>{"URL:"}</strong>
                <Link href={url}>{url}</Link>
              </div>
            )}

            {inventoryItem.repository.platform === "github" && (
              <Releases inventoryItem={inventoryItem} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
