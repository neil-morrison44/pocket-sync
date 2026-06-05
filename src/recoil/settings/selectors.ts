import { githubTokenAtom } from "./atoms"
import { atom } from "jotai"

export const githubHeadersSelector = atom<Promise<Record<string, string>>>(
  async (get) => {
    const githubToken = await get(githubTokenAtom)
    if (!githubToken.value) return {} as Record<string, string>
    return { Authorization: `Bearer ${githubToken.value}` }
  }
)
