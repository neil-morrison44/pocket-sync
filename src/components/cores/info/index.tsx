import { coresListSelector } from "../../../jotai/selectors"
import { useAtomValue } from "jotai"
import { InstalledCoreInfo } from "./installed"
import { NotInstalledCoreInfo } from "./notInstalled"

type CoreInfoProps = {
  coreName: string
  onBack: () => void
}

export const CoreInfo = (props: CoreInfoProps) => {
  // Kept while re-read, so it doesn't suspend the page on file changes
  const coresList = useAtomValue(coresListSelector)

  if (coresList.includes(props.coreName)) {
    return <InstalledCoreInfo {...props} />
  } else {
    return <NotInstalledCoreInfo {...props} />
  }
}
