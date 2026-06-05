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
  { owner: string; repo: string },
  Atom<Promise<GithubRelease[]>>
>(({ owner, repo }) =>
  atom(async (get, { signal }) => {
    const headers = await get(githubHeadersSelector)
    let response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases`,
      { headers, signal }
    )

    if (response.status === 403) {
      // try without headers, incase the org has disabled the type of auth
      response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/releases`,
        { signal }
      )
    }

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
