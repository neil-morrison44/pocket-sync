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

      return (await response.json()) as GithubRelease[]
    },
})
