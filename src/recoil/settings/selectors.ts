import { selector } from "recoil"
import { PatreonKeyInfo } from "../../types"

export const patreonKeyListSelector = selector<PatreonKeyInfo[]>({
  key: "patreonKeyListSelector",
  get: async () => {
    const response = await fetch(
      "https://raw.githubusercontent.com/neil-morrison44/pocket-sync/refs/heads/main/patreon_keys.json"
    )

    return response.json()
  },
})
