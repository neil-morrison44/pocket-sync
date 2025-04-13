import { GithubRelease } from "../../types"
import { coreInventoryAtom } from "../inventory/atoms"
import { githubHeadersSelector } from "../settings/selectors"
import { Atom, atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { atomFamilyDeepEqual } from "../../utils/jotai"

export const pocketSyncChangelogSelector = atom<Promise<string>>(
  async (_get, { signal }) => {
    const response = await fetch(
      "https://raw.githubusercontent.com/neil-morrison44/pocket-sync/refs/heads/main/CHANGELOG.md",
      { signal }
    )
    return response.text()
  }
)

export const GithubReleasesSelectorFamily = atomFamilyDeepEqual<
  { owner: string; repo: string; latest?: string },
  Atom<Promise<GithubRelease[]>>
>(({ owner, repo, latest }) =>
  atom(async (get, { signal }) => {
    if (!latest) await get(coreInventoryAtom)
    const headers = await get(githubHeadersSelector)
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases`,
      { headers, signal }
    )

    const remainingRateLimit = parseInt(
      response.headers.get("x-ratelimit-remaining") || "60"
    )

    if (remainingRateLimit < 1) {
      const timeTillReset = parseInt(
        response.headers.get("x-ratelimit-reset") || "0"
      )
      const resetDate = new Date(timeTillReset * 1000)
      throw new Error(
        `GitHub rate limit reached, retry after ${resetDate.toLocaleString()}`
      )
    }

    const releases = (await response.json()) as GithubRelease[]

    const sortedReleases = [...releases].sort((a, b) => {
      const aDate = new Date(a.published_at)
      const bDate = new Date(b.published_at)
      return bDate.getTime() - aDate.getTime()
    })

    return sortedReleases
  })
)
