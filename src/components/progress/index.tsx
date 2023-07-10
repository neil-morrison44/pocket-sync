import { useTranslation } from "react-i18next"
import { Pocket } from "../three/pocket"
import { ProgressScreen } from "../three/progressScreen"

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
    <>
      <Pocket
        move="back-and-forth"
        screenMaterial={
          <ProgressScreen value={percent} max={100} message={message} />
        }
      />
      {remainingTime && <div>{t("remaining_time", { remainingTime })}</div>}
    </>
  )
}
