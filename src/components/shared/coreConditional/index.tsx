import { useAtomValue } from "jotai"
import { ReactNode, useMemo } from "react"
import { coresListSelector } from "../../../recoil/selectors"

type CoreConditionalProps = {
  children: ReactNode
  core: string
}

export const CoreConditional = ({ children, core }: CoreConditionalProps) => {
  const coresList = useAtomValue(coresListSelector)
  const coreIsInstalled = useMemo(() => coresList.includes(core), [coresList])

  if (!coreIsInstalled) return null
  return <>{children}</>
}
