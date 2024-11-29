import { GithubRelease } from "../../types"
import { selectorFamily } from "recoil"
import { coreInventoryAtom } from "../inventory/atoms"
import { githubTokenAtom } from "../settings/atoms"
import { githubHeadersSelector } from "../settings/selectors"

export const GithubReleasesSelectorFamily = selectorFamily<
  GithubRelease[],
  { owner: string; repo: string; latest?: string }
>({
  key: "GithubReleasesSelectorFamily",
  get:
    ({ owner, repo, latest }) =>
    async ({ get }) => {
      if (!latest) get(coreInventoryAtom)
      const headers = get(githubHeadersSelector)

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/releases`,
        { headers }
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
    },
})
