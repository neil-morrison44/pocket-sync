import { coresListSelector } from "../../../recoil/selectors"
import { useSmoothedAtomValue } from "../../../utils/jotai"
import { InstalledCoreInfo } from "./installed"
import { NotInstalledCoreInfo } from "./notInstalled"

type CoreInfoProps = {
  coreName: string
  onBack: () => void
}

export const CoreInfo = (props: CoreInfoProps) => {
  const coresList = useSmoothedAtomValue(coresListSelector)

  if (coresList.includes(props.coreName)) {
    return <InstalledCoreInfo {...props} />
  } else {
    return <NotInstalledCoreInfo {...props} />
  }
}
