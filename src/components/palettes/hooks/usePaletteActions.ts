import { useCallback } from "react"
import { useAtomValue } from "jotai"

import { pocketPathAtom } from "../../../jotai/atoms"
import { invokeCopyFiles, invokeDeleteFiles } from "../../../utils/invokes"
import { splitAsPath } from "../../../utils/splitAsPath"

const PALETTES_FOLDER = "Assets/gb/common/Palettes"

/**
 * Duplicate, rename and delete for one palette. `name` is its path inside
 * the palettes folder, e.g. `/my_palette.pal` or `/folder/my_palette.pal`.
 */
export const usePaletteActions = (name: string) => {
  const pocketPath = useAtomValue(pocketPathAtom)
  const folder = `${pocketPath}/${PALETTES_FOLDER}`

  const duplicate = useCallback(async () => {
    await invokeCopyFiles([
      {
        origin: `${folder}${name}`,
        destination: `${folder}${name.replace(".pal", "_copy.pal")}`,
        exists: true,
      },
    ])
  }, [folder, name])

  /**
   * Renames the file, keeping it in its folder. Returns the new name, or
   * null if nothing changed or the name can't be used.
   */
  const rename = useCallback(
    async (newBaseName: string): Promise<string | null> => {
      const baseName = newBaseName.trim()
      if (!baseName || /[\\/]/.test(baseName)) return null

      const parts = splitAsPath(name)
      parts[parts.length - 1] = `${baseName}.pal`
      const newName = `/${parts.join("/")}`
      if (newName === `/${splitAsPath(name).join("/")}`) return null

      await invokeCopyFiles([
        {
          origin: `${folder}${name}`,
          destination: `${folder}${newName}`,
          exists: true,
        },
      ])
      await invokeDeleteFiles([`${PALETTES_FOLDER}${name}`])
      return newName
    },
    [folder, name]
  )

  const remove = useCallback(async () => {
    await invokeDeleteFiles([`${PALETTES_FOLDER}${name}`])
  }, [name])

  return { duplicate, rename, remove }
}

/** The file name without its folder and `.pal`, e.g. `my_palette`. */
export const paletteBaseName = (name: string) =>
  (splitAsPath(name).at(-1) ?? name).replace(/\.pal$/, "")

/** The folders a palette sits in, e.g. `["folder"]`; empty at the top. */
export const paletteFolders = (name: string) => splitAsPath(name).slice(0, -1)
