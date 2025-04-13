import { PatreonKeyInfo } from "../../types"
import { githubTokenAtom } from "./atoms"
import { atom } from "jotai"

export const patreonKeyListSelector = atom<Promise<PatreonKeyInfo[]>>(
  async (_get, { signal }) => {
    const response = await fetch(
      "https://raw.githubusercontent.com/neil-morrison44/pocket-sync/refs/heads/main/patreon_keys.json",
      { signal }
    )

    return response.json()
  }
)

export const githubHeadersSelector = atom<Promise<Record<string, string>>>(
  async (get) => {
    const githubToken = await get(githubTokenAtom)
    if (!githubToken.value) return {} as Record<string, string>
    return { Authorization: `Bearer ${githubToken.value}` }
  }
)
