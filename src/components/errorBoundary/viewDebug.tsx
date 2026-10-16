import { currentViewAtom } from "../../jotai/view/atoms"
import { useAtomValue } from "jotai"

export const ViewDebug = () => {
  const currentView = useAtomValue(currentViewAtom)

  // Where it happened, e.g. "Cores: Spiritualized.GB"
  // eslint-disable-next-line react/jsx-no-literals
  return (
    <p className="error-boundary__where">{`${currentView.view}: ${currentView.selected}`}</p>
  )
}
