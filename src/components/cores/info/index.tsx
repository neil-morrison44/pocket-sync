import { useRecoilValue } from "recoil"
import { coresListSelector } from "../../../recoil/selectors"
import { InstalledCoreInfo } from "./installed"
import { NotInstalledCoreInfo } from "./notInstalled"

type CoreInfoProps = {
  coreName: string
  onBack: () => void
}

export const CoreInfo = (props: CoreInfoProps) => {
  const coresList = useRecoilValue(coresListSelector)

  if (coresList.includes(props.coreName)) {
    return <InstalledCoreInfo {...props} />
  } else {
    return <NotInstalledCoreInfo {...props} />
  }
}
