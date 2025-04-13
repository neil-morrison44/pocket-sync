import { FileWatchAtomFamily, FolderWatchAtomFamily } from "../fileSystem/atoms"
import { invokeReadBinaryFile } from "../../utils/invokes"
import { GithubRelease, Palette, rgb } from "../../types"
import { fetch as TauriFetch } from "@tauri-apps/plugin-http"
import { paletteRepoAtom } from "./atoms"
import * as zip from "@zip.js/zip.js"
import { error } from "@tauri-apps/plugin-log"
import { githubHeadersSelector } from "../settings/selectors"
import { WalkDirSelectorFamily } from "../selectors"
import { Atom, atom } from "jotai"
import { atomFamily } from "jotai/utils"

export const palettesListSelector = atom<Promise<string[]>>(async (get) => {
  const path = "Assets/gb/common/palettes"
  return get(WalkDirSelectorFamily({ path, extensions: ["pal"] }))
})

export const PaletteColoursSelectorFamily = atomFamily<
  string,
  Atom<Promise<Palette>>
>((name: string) =>
  atom(async (get) => {
    const path = `Assets/gb/common/palettes${name}`
    get(FileWatchAtomFamily(path))
    const data = await invokeReadBinaryFile(path)

    return {
      background: parsePalette(data.subarray(0, 12)),
      obj0: parsePalette(data.subarray(12, 24)),
      obj1: parsePalette(data.subarray(24, 36)),
      window: parsePalette(data.subarray(36, 48)),
      off: Array.from(data.subarray(48, 51)) as rgb,
    } satisfies Palette
  })
)

const parsePalette = (data: Uint8Array): [rgb, rgb, rgb, rgb] => {
  return data
    .reduce(
      (acc, current, index) => {
        const palIndex = Math.floor(index / 3)
        acc[palIndex].push(current)
        return acc
      },
      [[], [], [], []] as number[][]
    )
    .reverse() as [rgb, rgb, rgb, rgb]
}

export const GameBoyGameSelectorFamily = atomFamily<
  string,
  Atom<Promise<Uint8Array>>
>((game: string) =>
  atom(async (get) => {
    const path = `Assets/gb/${game}`
    get(FileWatchAtomFamily(path))
    const data = await invokeReadBinaryFile(path)
    return data
  })
)

export const PaletteCodeSelectorFamily = atomFamily<
  string,
  Atom<Promise<string>>
>((name: string) =>
  atom(async (get) => {
    const path = `Assets/gb/common/palettes${name}`
    get(FileWatchAtomFamily(path))
    const data = await invokeReadBinaryFile(path)
    let encodedName = "Imported Palette"

    try {
      encodedName = window.btoa(name)
    } catch (err) {
      error(`Palette Code error: ${name} - ${err}`)
    }

    return (
      Array.from(data)
        .map((s) => s.toString(16).padStart(2, "0"))
        .join("") + encodedName
    )
  })
)

export const palleteZipURLSelector = atom<Promise<string | null>>(
  async (get, { signal }) => {
    const repo = get(paletteRepoAtom)
    const headers = await get(githubHeadersSelector)

    const response = await TauriFetch(
      `https://api.github.com/repos/${repo}/releases/latest`,
      {
        method: "GET",
        headers,
        signal,
      }
    )

    const data = (await response.json()) as GithubRelease

    const zip = (data?.assets || []).find((asset) =>
      asset.name.endsWith(".zip")
    )

    if (zip) {
      return zip.browser_download_url
    } else {
      return null
    }
  }
)

const palleteZipBlobSelector = atom<Promise<Blob | null>>(
  async (get, { signal }) => {
    const zipUrl = await get(palleteZipURLSelector)
    if (!zipUrl) return null

    const fileResponse = await TauriFetch(zipUrl, {
      method: "GET",
      connectTimeout: 60e3,
      signal,
    })

    const data = await fileResponse.arrayBuffer()
    const fileBlob = new Blob([data], {
      type: "application/zip",
    })

    return fileBlob
  }
)

export const downloadablePalettesSelector = atom<
  Promise<{ name: string; paletteData: Blob; path: string }[] | null>
>(async (get) => {
  const zipBlob = await get(palleteZipBlobSelector)

  if (!zipBlob) return null

  const abortController = new AbortController()
  const entries = await new zip.ZipReader(new zip.BlobReader(zipBlob), {
    signal: abortController.signal,
  }).getEntries({})

  return Promise.all(
    entries
      .filter((entry) => {
        const filename = entry.filename.split("/").at(-1) || ""
        return (
          filename.endsWith(".pal") &&
          !filename.startsWith(".") &&
          entry.getData
        )
      })
      .map(async (entry) => ({
        name: (entry.filename.split("/").at(-1) as string).replace(".pal", ""),
        // @ts-expect-error
        paletteData: await entry.getData(new zip.BlobWriter()),
        path: entry.filename.replace("Assets/gb/common/Palettes/", ""),
      }))
  )
})

export const DownloadablePaletteColoursSelectorFamily = atomFamily<
  string,
  Atom<Promise<Palette>>
>((path: string) =>
  atom(async (get) => {
    const downloadablePalettes = await get(downloadablePalettesSelector)
    if (!downloadablePalettes) throw new Error("Attempt to open null palette")
    const palette = downloadablePalettes.find((p) => p.path === path)
    if (!palette) throw new Error("Attempt to open missing palette")
    const data = new Uint8Array(await palette.paletteData.arrayBuffer())

    return {
      background: parsePalette(data.subarray(0, 12)),
      obj0: parsePalette(data.subarray(12, 24)),
      obj1: parsePalette(data.subarray(24, 36)),
      window: parsePalette(data.subarray(36, 48)),
      off: Array.from(data.subarray(48, 51)) as rgb,
    } satisfies Palette
  })
)
