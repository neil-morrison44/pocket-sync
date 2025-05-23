import {
  BaseDirectory,
  exists,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs"
import { atomFamily, useAtomCallback } from "jotai/utils"
import deepEqual from "fast-deep-equal/es6"
import {
  Atom,
  atom,
  WritableAtom,
  useSetAtom,
  useStore,
  useAtomValue,
} from "jotai"
import { startTransition, use, useCallback, useEffect, useState } from "react"
import { warn } from "@tauri-apps/plugin-log"

export const atomFamilyDeepEqual: typeof atomFamily = (initAtom, areEqual) =>
  atomFamily(initAtom, areEqual ?? deepEqual)

export const atomWithAppLocalStorage = <T>(
  fileName: string,
  initialValue: T
) => {
  const baseAtom = atom<T | null>(null)

  return atom(
    async (get) => {
      const base = get(baseAtom)
      if (base !== null) return base
      const fileExists = await exists(`${fileName}.json`, {
        baseDir: BaseDirectory.AppLocalData,
      })
      if (!fileExists) return initialValue

      const text = await readTextFile(`${fileName}.json`, {
        baseDir: BaseDirectory.AppLocalData,
      })
      let value = initialValue
      try {
        value = JSON.parse(text) as T
      } catch (err) {
        warn(`Error Reading Config File ${fileName}, ${err} \n "${text}"`)
      }
      return value
    },
    async (_get, set, newValue: T) => {
      set(baseAtom, newValue)
      const text = JSON.stringify(newValue, null, 2)
      await writeTextFile(`${fileName}.json`, text, {
        baseDir: BaseDirectory.AppLocalData,
      })
    }
  )
}

export const useSmoothedAtomValue = <T>(atom: Atom<Promise<T>>) => {
  const store = useStore()
  const [firstProm] = useState(() => store.get(atom))
  const value = use(firstProm)
  const [state, setState] = useState<T>(value)

  useEffect(() => {
    store.sub(atom, async () => {
      const value = await store.get(atom)
      startTransition(() => setState(value))
    })
  }, [store, atom])

  useEffect(() => {
    store.get(atom).then((value) => startTransition(() => setState(value)))
  }, [atom])

  return state
}

export const useSmoothedAtom = <T>(
  atom: WritableAtom<Promise<T>, [T], Promise<void>>
) => {
  const setThing = useSetAtom(atom)
  const value = useSmoothedAtomValue(atom)
  return [value, setThing] as const
}

export const useSetAtomFnSet = <T>(
  atom: WritableAtom<Promise<T>, [T], Promise<void>>
) => {
  const setAtom = useAtomCallback(
    useCallback(
      async (
        get,
        set,
        updater: ((current: T) => T) | ((current: T) => Promise<T>) | T
      ) => {
        switch (typeof updater) {
          case "function": {
            const currentValue = await get(atom)
            // @ts-expect-error have checked it's a function...
            const newValue = await updater(currentValue)
            set(atom, newValue)
            break
          }
          default: {
            set(atom, updater)
          }
        }
      },
      []
    )
  )
  return setAtom
}

export const useAtomFnSet = <T>(
  atom: WritableAtom<Promise<T>, [T], Promise<void>>
) => {
  const value = useAtomValue(atom)
  const setAtom = useSetAtomFnSet(atom)
  return [value, setAtom] as const
}
