import { currentViewAtom } from "../../recoil/view/atoms"
import { useAtomValue } from "jotai"

export const ViewDebug = () => {
  const currentView = useAtomValue(currentViewAtom)

  // eslint-disable-next-line react/jsx-no-literals
  return <b>{`${currentView.view}: ${currentView.selected}`}</b>
}
