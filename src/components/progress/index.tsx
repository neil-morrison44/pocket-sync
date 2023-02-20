import { Pocket } from "../three/pocket"
import { ProgressScreen } from "../three/progressScreen"

type ProgressProps = {
  percent: number
  message?: string | null
}

export const Progress = ({ percent, message }: ProgressProps) => (
  <Pocket
    move="back-and-forth"
    screenMaterial={
      <ProgressScreen value={percent} max={100} message={message} />
    }
  />
)
