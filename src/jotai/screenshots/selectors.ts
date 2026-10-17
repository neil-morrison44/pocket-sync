import { Screenshot, VideoJSON } from "../../types"
import {
  invokeFileExists,
  invokeListFiles,
  invokeReadBinaryFile,
} from "../../utils/invokes"
import { getBinaryMetadata } from "../../utils/getBinaryMetadata"
import { readJSONFile } from "../../utils/readJSONFile"
import { fsWatchAtomFamily } from "../fileSystem/atoms"
import { atom, Atom } from "jotai"
import { atomFamily } from "jotai-family"
import { keepPrevious } from "../../utils/jotai"

export const VideoJSONSelectorFamily = atomFamily<
  string,
  Atom<Promise<VideoJSON>>
>((coreName) =>
  atom(async (get) => {
    const path = `Cores/${coreName}/video.json`
    get(fsWatchAtomFamily(path))
    const exists = await invokeFileExists(path)
    if (!exists)
      return {
        video: {
          scaler_modes: [],
          magic: "APF_VER_1",
        },
      } satisfies VideoJSON

    return readJSONFile<VideoJSON>(path)
  })
)

export const screenshotsListSelector = atom<Promise<string[]>>(async (get) => {
  get(fsWatchAtomFamily("Memories/Screenshots"))
  return await invokeListFiles("Memories/Screenshots")
})

/**
 * When a screenshot was taken, from its file name: the Pocket names them
 * `YYYYMMDD_HHMMSS.png` in its local time. The file is read into memory, so
 * its own modified date would be "now". Null for other names.
 */
const parseScreenshotDate = (fileName: string): Date | null => {
  const match = /^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/.exec(fileName)
  if (!match) return null
  const [year, month, day, hours, minutes, seconds] = match.slice(1).map(Number)
  const date = new Date(year, month - 1, day, hours, minutes, seconds)
  return Number.isNaN(date.getTime()) ? null : date
}

export const SingleScreenshotSelectorFamily = atomFamily<
  string,
  Atom<Promise<Screenshot | null>>
>((fileName) =>
  atom(async (get) => {
    const path = `Memories/Screenshots/${fileName}`
    get(fsWatchAtomFamily(path))

    const data = await invokeReadBinaryFile(path)
    const buf = new Uint8Array(data)
    const file = new File([buf], fileName, { type: "image/png" })
    const metadata = getBinaryMetadata(buf, true)

    return {
      file,
      file_name: fileName,
      timestamp: parseScreenshotDate(fileName),
      ...metadata,
    }
  })
)

export type ScreenshotInfo = {
  fileName: string
  game: string
  platform: string
  /** The full core name, e.g. "Spiritualized.GB"; empty if unknown. */
  core: string
  timestamp: Date | null
}

/**
 * What every screenshot shows (game, core, date), for grouping and filters.
 * Reads every screenshot once; each one is cached for the grid afterwards.
 */
export const screenshotsInfoSelector = atom<Promise<ScreenshotInfo[]>>(
  async (get) => {
    const fileNames = await get(screenshotsListSelector)
    const screenshots = await Promise.all(
      fileNames.map((fileName) => get(SingleScreenshotSelectorFamily(fileName)))
    )
    return screenshots.flatMap((screenshot, index) =>
      screenshot
        ? [
            {
              fileName: fileNames[index],
              game: screenshot.game,
              platform: screenshot.platform,
              core:
                screenshot.author && screenshot.core
                  ? `${screenshot.author}.${screenshot.core}`
                  : "",
              timestamp: screenshot.timestamp,
            },
          ]
        : []
    )
  }
)

/** The same, keeping the last list while it reloads after file events. */
export const screenshotsInfoKeptSelector = keepPrevious(screenshotsInfoSelector)

export const SingleScreenshotImageSelectorFamily = atomFamily<
  string,
  Atom<Promise<HTMLImageElement | null>>
>((fileName) =>
  atom(async (get) => {
    const screenshot = await get(SingleScreenshotSelectorFamily(fileName))
    if (!screenshot) return null

    const image = new Image()

    const loadPromise = new Promise<HTMLImageElement>((resolve) => {
      image.onload = () => resolve(image)
    })

    image.src = URL.createObjectURL(screenshot.file)
    return loadPromise
  })
)
