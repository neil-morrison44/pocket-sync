import { coresListSelector } from "../../../jotai/selectors"
import { useAtomValue } from "jotai"
import { InstalledCoreInfo } from "./installed"
import { NotInstalledCoreInfo } from "./notInstalled"

type CoreInfoProps = {
  coreName: string
  onBack: () => void
}

export const CoreInfo = (props: CoreInfoProps) => {
  const coresList = useAtomValue(coresListSelector)

  if (coresList.includes(props.coreName)) {
    return <InstalledCoreInfo {...props} />
  } else {
    return <NotInstalledCoreInfo {...props} />
  }
}
