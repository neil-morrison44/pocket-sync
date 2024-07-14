import "./index.css"
import { useTranslation } from "react-i18next"

type StopButton = {
  onClick: () => void
  status: "Running" | "Stopping"
}

export const StopButton = ({ onClick, status }: StopButton) => {
  const { t } = useTranslation("jobs")

  return (
    <button className="jobs__stop-button" onClick={onClick}>
      {t(status)}
    </button>
  )
}
