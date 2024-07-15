import { useTranslation } from "react-i18next"
import { ProgressScreen } from "../three/progressScreen"
import { ColourContextProviderFromConfig } from "../three/colourContext"
import React, { Suspense } from "react"

const Pocket = React.lazy(() =>
  import("../three/pocket").then((m) => ({ default: m.Pocket }))
)

type ProgressProps = {
  percent: number
  message?: string | null
  remainingTime?: string
}

export const Progress = ({
  percent,
  message,
  remainingTime,
}: ProgressProps) => {
  const { t } = useTranslation("progress")

  return (
    <ColourContextProviderFromConfig>
      <Suspense>
        <Pocket
          move="back-and-forth"
          screenMaterial={
            <ProgressScreen value={percent} max={100} message={message} />
          }
        />
      </Suspense>
      {remainingTime && <div>{t("remaining_time", { remainingTime })}</div>}
    </ColourContextProviderFromConfig>
  )
}
