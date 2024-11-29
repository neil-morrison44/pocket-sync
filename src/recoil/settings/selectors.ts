import { selector } from "recoil"
import { PatreonKeyInfo } from "../../types"
import { githubTokenAtom } from "./atoms"

export const patreonKeyListSelector = selector<PatreonKeyInfo[]>({
  key: "patreonKeyListSelector",
  get: async () => {
    const response = await fetch(
      "https://raw.githubusercontent.com/neil-morrison44/pocket-sync/refs/heads/main/patreon_keys.json"
    )

    return response.json()
  },
})

export const githubHeadersSelector = selector<Record<string, string>>({
  key: "githubHeadersSelector",
  get: ({ get }) => {
    const githubToken = get(githubTokenAtom)
    if (!githubToken.value) return {} as Record<string, string>
    return { Authorization: `Bearer ${githubToken.value}` }
  },
})
