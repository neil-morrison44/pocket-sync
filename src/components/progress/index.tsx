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
  speed?: string
}

export const Progress = ({
  percent,
  message,
  remainingTime,
  speed,
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
      {remainingTime && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div>{t("remaining_time", { remainingTime })}</div>
          {speed && <div>{t("speed", { speed })}</div>}
        </div>
      )}
    </ColourContextProviderFromConfig>
  )
}
