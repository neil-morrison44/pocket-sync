import { useProgress } from "../../../hooks/useProgress"
import { Progress } from "../../progress"

export const FileInstallProgress = () => {
  const { percent, lastMessage, remainingTime } = useProgress()

  return (
    <div className="update-all__core-progress">
      <Progress
        percent={percent}
        message={lastMessage}
        remainingTime={remainingTime}
      />
    </div>
  )
}
