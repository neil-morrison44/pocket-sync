import { AtomEffect } from "recoil"
import {
  writeTextFile,
  BaseDirectory,
  readTextFile,
  exists,
} from "@tauri-apps/api/fs"

export function syncToAppLocalDataEffect<T>(filename: string): AtomEffect<T> {
  return ({ trigger, onSet, setSelf }) => {
    onSet(async (newValue) => {
      console.log(`onSet ${newValue}`)
      const text = JSON.stringify(newValue)
      await writeTextFile(`${filename}.json`, text, {
        dir: BaseDirectory.AppLocalData,
      })
    })

    if (trigger === "get") {
      const read = async () => {
        const fileExists = await exists(`${filename}.json`, {
          dir: BaseDirectory.AppLocalData,
        })

        if (fileExists) {
          await readTextFile(`${filename}.json`, {
            dir: BaseDirectory.AppLocalData,
          }).then((text) => {
            const value = JSON.parse(text) as T
            setSelf(value)
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
    dir: BaseDirectory.AppLocalData,
  })

  if (fileExists) {
    const text = await readTextFile(`${filename}.json`, {
      dir: BaseDirectory.AppLocalData,
    })
    const value = JSON.parse(text) as T
    return value
  } else {
    return initialDefault
  }
}
