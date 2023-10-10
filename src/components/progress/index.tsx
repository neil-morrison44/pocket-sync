import { useTranslation } from "react-i18next"
import { Pocket } from "../three/pocket"
import { ProgressScreen } from "../three/progressScreen"
import { ColourContextProviderFromConfig } from "../three/colourContext"

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
      <Pocket
        move="back-and-forth"
        screenMaterial={
          <ProgressScreen value={percent} max={100} message={message} />
        }
      />
      {remainingTime && <div>{t("remaining_time", { remainingTime })}</div>}
    </ColourContextProviderFromConfig>
  )
}
