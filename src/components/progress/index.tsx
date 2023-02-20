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
}: ProgressProps) => (
  <>
    <Pocket
      move="back-and-forth"
      screenMaterial={
        <ProgressScreen value={percent} max={100} message={message} />
      }
    />
    {remainingTime && <div>{`Remaining Time (approx): ${remainingTime}`}</div>}
  </>
)
