import { atomWithAppLocalStorage } from "../../utils/jotai"

export const alwaysUseEnglishAtom = atomWithAppLocalStorage<{ value: boolean }>(
  "only-use-english",
  {
    value: false,
  }
)

export const turboDownloadsAtom = atomWithAppLocalStorage<{ enabled: boolean }>(
  "turbo-downloads",
  {
    enabled: false,
  }
)

export const keepPlatformDataAtom = atomWithAppLocalStorage<{
  enabled: boolean
}>("keep-platform-data", {
  enabled: true,
})

export const githubTokenAtom = atomWithAppLocalStorage<{
  value: null | string
}>("github-token-atom", {
  value: null,
})
