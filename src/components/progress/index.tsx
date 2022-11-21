import { Pocket } from "../three/pocket"
import { ProgressScreen } from "../three/progressScreen"

type ProgressProps = {
  value: number
  max: number
}

export const Progress = ({ value, max }: ProgressProps) => (
  <Pocket
    move="back-and-forth"
    screenMaterial={<ProgressScreen value={value} max={max} />}
  />
)
