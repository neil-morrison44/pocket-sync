import { atomWithStorage } from "jotai/utils"
import { createAppLocalStorage } from "../../utils/jotai"

export const alwaysUseEnglishAtom = atomWithStorage<{ value: boolean }>(
  "only-use-english",
  {
    value: false,
  },
  createAppLocalStorage(),
  { getOnInit: true }
)

export const turboDownloadsAtom = atomWithStorage<{ enabled: boolean }>(
  "turbo-downloads",
  {
    enabled: false,
  },
  createAppLocalStorage(),
  { getOnInit: true }
)

export const keepPlatformDataAtom = atomWithStorage<{ enabled: boolean }>(
  "keep-platform-data",
  {
    enabled: true,
  },
  createAppLocalStorage(),
  { getOnInit: true }
)

export const githubTokenAtom = atomWithStorage<{ value: null | string }>(
  "github-token-atom",
  {
    value: null,
  },
  createAppLocalStorage(),
  { getOnInit: true }
)
