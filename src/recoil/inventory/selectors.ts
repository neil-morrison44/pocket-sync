import { selector, selectorFamily } from "recoil"
import { Category } from "../../types"
import { GithubReleasesSelectorFamily } from "../github/selectors"
import { allCategoriesSelector } from "../platforms/selectors"
import { coreInventoryAtom } from "./atoms"

export const DownloadURLSelectorFamily = selectorFamily<string | null, string>({
  key: "DownloadURLSelectorFamily",
  get:
    (coreName: string) =>
    async ({ get }) => {
      const inventory = get(coreInventoryAtom)
      const inventoryItem = inventory.data.find(
        ({ identifier }) => coreName === identifier
      )
      if (!inventoryItem || inventoryItem.repository.platform !== "github")
        return null

      const { owner, name: repo } = inventoryItem.repository

      const githubReleaseList = get(
        GithubReleasesSelectorFamily({ owner, repo })
      )

      const zips = githubReleaseList[0].assets.filter(({ name }) =>
        name.endsWith(".zip")
      )

      if (zips.length === 1) return zips[0].browser_download_url
      const coreZip = githubReleaseList[0].assets.find(({ name }) => {
        // hopefully this doesn't get used much
        const [_, core] = coreName.split(".")
        const simpleCore = core.replace(/[^\x00-\x7F]/g, "").toLowerCase()
        const simpleName = name.replace(/[^\x00-\x7F]/g, "").toLowerCase()

        const regex = new RegExp(`[^a-zA-Z0-9]${simpleCore}[^a-zA-Z0-9]`)
        return name.endsWith(".zip") && regex.test(simpleName)
      })

      if (!coreZip) return null

      return coreZip.browser_download_url
    },
})

export const cateogryListselector = selector<Category[]>({
  key: "CateogryListselector",
  get: ({ get }) => {
    const inventory = get(coreInventoryAtom)
    const deviceCategories = get(allCategoriesSelector)

    const cateogrySet = new Set([
      ...inventory.data.flatMap(({ release, prerelease }) => {
        const releaseDetails = release ?? prerelease
        if (!releaseDetails) return []
        const { platform } = releaseDetails
        return platform.category ? [platform.category] : []
      }),
      ...deviceCategories,
    ])

    return ["All", ...Array.from(cateogrySet)]
  },
})
