import { GithubRelease } from "../../types"
import { selectorFamily } from "recoil"
import { coreInventoryAtom } from "../inventory/atoms"

export const GithubReleasesSelectorFamily = selectorFamily<
  GithubRelease[],
  { owner: string; repo: string }
>({
  key: "GithubReleasesSelectorFamily",
  get:
    ({ owner, repo }) =>
    async ({ get }) => {
      get(coreInventoryAtom)
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/releases`
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

      return (await response.json()) as GithubRelease[]
    },
})
