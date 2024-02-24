import { useProgress } from "../../../hooks/useProgress"
import { Progress } from "../../progress"

export const FileInstallProgress = () => {
  const { percent, message, remainingTime } = useProgress(
    "install_archive_files"
  )

  return (
    <div className="update-all__core-progress">
      <Progress
        percent={percent}
        message={message?.param}
        remainingTime={remainingTime}
      />
    </div>
  )
}
