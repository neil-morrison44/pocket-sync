import { AtomEffect } from "recoil"
import {
  writeTextFile,
  BaseDirectory,
  readTextFile,
  exists,
} from "@tauri-apps/plugin-fs"

export function syncToAppLocalDataEffect<T>(filename: string): AtomEffect<T> {
  return ({ trigger, onSet, setSelf }) => {
    onSet(async (newValue) => {
      const text = JSON.stringify(newValue)
      await writeTextFile(`${filename}.json`, text, {
        baseDir: BaseDirectory.AppLocalData,
      })
    })

    if (trigger === "get") {
      const read = async () => {
        const fileExists = await exists(`${filename}.json`, {
          baseDir: BaseDirectory.AppLocalData,
        })

        if (fileExists) {
          await readTextFile(`${filename}.json`, {
            baseDir: BaseDirectory.AppLocalData,
          }).then((text) => {
            try {
              const value = JSON.parse(text) as T
              setSelf(value)
            } catch (err) {
              console.log(
                `Error Reading Config File ${filename}, ${err} \n ${text}`
              )
            }
          })
        }
      }

      read()
    }
  }
}

export async function syncToAppLocalDataEffectDefault<T>(
  filename: string,
  initialDefault: T
): Promise<T> {
  const fileExists = await exists(`${filename}.json`, {
    baseDir: BaseDirectory.AppLocalData,
  })

  if (fileExists) {
    const text = await readTextFile(`${filename}.json`, {
      baseDir: BaseDirectory.AppLocalData,
    })
    let value = initialDefault
    try {
      value = JSON.parse(text) as T
    } catch (err) {
      console.log(`Error Reading Config File ${filename}, ${err} \n ${text}`)
    }
    return value
  } else {
    return initialDefault
  }
}
