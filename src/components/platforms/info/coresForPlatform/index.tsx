import { Suspense } from "react"
import { useTranslation } from "react-i18next"
import { useAtomValue, useSetAtom } from "jotai"
import { CoresForPlatformSelectorFamily } from "../../../../jotai/platforms/selectors"
import { currentViewAtom } from "../../../../jotai/view/atoms"
import { PlatformId } from "../../../../types"
import { CoreItem } from "../../../cores/item"
import { Grid } from "../../../grid"
import { CardSkeleton } from "../../../ui/Skeleton"

/** The installed cores for a platform, as core cards that open the core. */
export const CoresForPlatform = ({
  platformId,
}: {
  platformId: PlatformId
}) => {
  const cores = useAtomValue(CoresForPlatformSelectorFamily(platformId))
  const setViewAndSubview = useSetAtom(currentViewAtom)
  const { t } = useTranslation("platform_info")

  if (cores.length === 0) {
    return <p className="detail-page__hint">{t("no_cores")}</p>
  }

  return (
    <Grid className="platform-info__cores" placeholderItemHeight={160}>
      {cores.map((coreName) => (
        <Suspense fallback={<CardSkeleton height={160} />} key={coreName}>
          <CoreItem
            coreName={coreName}
            onClick={() =>
              setViewAndSubview({ view: "Cores", selected: coreName })
            }
          />
        </Suspense>
      ))}
    </Grid>
  )
}
