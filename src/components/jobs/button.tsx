import "./index.css"
import { useTranslation } from "react-i18next"
import Button from "../ui/Button"

type StopButton = {
  onClick: () => void
  status: "Running" | "Stopping"
}

/** Cancels a running job, e.g. downloading files; at the end of its row. */
export const StopButton = ({ onClick, status }: StopButton) => {
  const { t } = useTranslation("jobs")

  return (
    <div className="jobs__stop">
      <Button icon="close" disabled={status === "Stopping"} onClick={onClick}>
        {t(status)}
      </Button>
    </div>
  )
}
