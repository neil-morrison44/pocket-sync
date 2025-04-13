import {
  BaseDirectory,
  exists,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs"
import { atomFamily, loadable, unwrap } from "jotai/utils"
import deepEqual from "fast-deep-equal/es6"
import { Atom, atom, WritableAtom, useSetAtom, useStore } from "jotai"
import { startTransition, use, useEffect, useState } from "react"
import { withAtomEffect } from "jotai-effect"

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
      console.log({ fileExists })
      if (!fileExists) return initialValue

      const text = await readTextFile(`${fileName}.json`, {
        baseDir: BaseDirectory.AppLocalData,
      })
      let value = initialValue
      try {
        console.log(text)
        value = JSON.parse(text) as T
      } catch (err) {
        console.log(`Error Reading Config File ${fileName}, ${err} \n ${text}`)
      }

      console.log({ value })
      return value
    },
    async (_get, set, newValue: T) => {
      set(baseAtom, newValue)

      const text = JSON.stringify(newValue)
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

  return state
}

export const useSmoothedAtom = <T>(
  atom: WritableAtom<Promise<T>, [T], Promise<void>>
) => {
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

  const setThing = useSetAtom(atom)
  return [state, setThing] as const
}
