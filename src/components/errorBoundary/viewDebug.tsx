import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { currentViewAtom } from "../../recoil/view/atoms"

export const ViewDebug = () => {
  const currentView =
    useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(currentViewAtom)

  // eslint-disable-next-line react/jsx-no-literals
  return <b>{`${currentView.view}: ${currentView.selected}`}</b>
}
