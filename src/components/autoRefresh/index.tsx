import { useEffect } from "react"
import { useSetRecoilState } from "recoil"
import { coreInventoryAtom } from "../../recoil/inventory/atoms"
import { newsFeedUpdateAtom } from "../../recoil/newsFeed/atoms"

const INTERVAL_MINS = 10

export const AutoRefresh = () => {
  const setInventoryAtom = useSetRecoilState(coreInventoryAtom)

  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch(
        "https://openfpga-cores-inventory.github.io/analogue-pocket/api/v2/cores.json"
      )
      setInventoryAtom(await response.json())
    }, INTERVAL_MINS * 60 * 1000)

    return () => clearInterval(interval)
  }, [setInventoryAtom])

  return null
}
