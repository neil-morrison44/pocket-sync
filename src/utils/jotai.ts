import {
  BaseDirectory,
  exists,
  readTextFile,
  remove,
  writeTextFile,
} from "@tauri-apps/plugin-fs"
import { atomFamily } from "jotai/utils"
import {
  AsyncStorage,
  atomWithStorage,
} from "jotai/vanilla/utils/atomWithStorage"
import deepEqual from "fast-deep-equal/es6"

export const createAppLocalStorage = <T>(): AsyncStorage<T> => ({
  getItem: async (filename: string, initialValue: T): Promise<T> => {
    const fileExists = await exists(`${filename}.json`, {
      baseDir: BaseDirectory.AppLocalData,
    })
    if (!fileExists) return initialValue

    const text = await readTextFile(`${filename}.json`, {
      baseDir: BaseDirectory.AppLocalData,
    })
    let value = initialValue
    try {
      value = JSON.parse(text) as T
    } catch (err) {
      console.log(`Error Reading Config File ${filename}, ${err} \n ${text}`)
    }
    return value
  },
  setItem: async (filename: string, newValue: T): Promise<void> => {
    const text = JSON.stringify(newValue)
    await writeTextFile(`${filename}.json`, text, {
      baseDir: BaseDirectory.AppLocalData,
    })
  },
  removeItem: async (filename: string): Promise<void> => {
    await remove(`${filename}.json`, {
      baseDir: BaseDirectory.AppLocalData,
    })
  },
})

export const atomFamilyDeepEqual: typeof atomFamily = (initAtom, areEqual) =>
  atomFamily(initAtom, areEqual ?? deepEqual)

// export const atomWithAppLocalStorage: typeof atomWithStorage = (
//   key,
//   initialValue,
//   storage,
//   options
// ) =>
//   atomWithStorage(
//     key,
//     initialValue,
//     storage ?? createAppLocalStorage(),
//     options ?? { getOnInit: true }
//   )
