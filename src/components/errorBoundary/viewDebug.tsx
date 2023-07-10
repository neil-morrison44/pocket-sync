import { useRecoilValue } from "recoil"
import { currentViewAtom } from "../../recoil/view/atoms"

export const ViewDebug = () => {
  const currentView = useRecoilValue(currentViewAtom)

  // eslint-disable-next-line react/jsx-no-literals
  return <b>{`${currentView.view}: ${currentView.selected}`}</b>
}
