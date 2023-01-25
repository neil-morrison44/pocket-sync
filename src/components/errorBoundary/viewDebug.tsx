import { useRecoilValue } from "recoil"
import { currentViewAtom } from "../../recoil/view/atoms"

export const ViewDebug = () => {
  const currentView = useRecoilValue(currentViewAtom)

  return <b>{`${currentView.view}: ${currentView.selected}`}</b>
}
