import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react"
import { emit, listen } from "@tauri-apps/api/event"
import { atom, useAtomValue, useSetAtom } from "jotai"

import { AllSavesSelector } from "../../../jotai/saves/selectors"
import { pocketPathAtom } from "../../../jotai/atoms"
import { invokeBeginMisterSaveSyncSession } from "../../../utils/invokes"
import {
  FileMetadataSelectorFamily,
  MiSTerPlatformsForPocketPlatformSelectorFamily,
  MiSTerSaveInfoSelectorFamily,
} from "./recoil/selectors"

export type MisterCreds = { host: string; user: string; password: string }

/** A save on the MiSTer; null when it isn't there. */
export type MisterSave = { crc32?: number; timestamp?: number; path?: string }

/** A save on the Pocket. */
export type PocketSave = { crc32: number; timestamp: number }

/**
 * Where MiSTer Sync gets its data and sends its actions: the backend (FTP to
 * the MiSTer) for a real session, or made-up data for the preview in
 * Settings → Developer. The `use…` members are hooks; a source never
 * changes while it's mounted, so they're always called in the same order.
 */
export type MisterSource = {
  demo: boolean
  /** Opens the session; false when the MiSTer can't be reached. */
  connect: (creds: MisterCreds) => Promise<boolean>
  /** Keeps the session open; called every 10s while connected. */
  heartbeat: () => void
  /** Ends the session, e.g. on leaving. */
  end: () => void
  /** The Pocket's saves, as paths below `Saves/` (`gb/Tetris.sav`). */
  useSaves: () => string[]
  /** The MiSTer folders a Pocket platform's saves map to. */
  useMisterFolders: (platform: string | undefined) => string[]
  useMisterSave: (
    platforms: string[],
    file: string | undefined
  ) => MisterSave | null
  usePocketSave: (path: string) => PocketSave
  copyToMister: (path: string, misterPath: string) => void
  copyToPocket: (path: string, misterPath: string) => void
  /** Messages from the session, newest first. */
  useLog: () => string[]
}

const MISTER_SAVES_ROOT = "/media/fat/saves/"

/** The real session, through the backend. */
const useRealSource = (): MisterSource => {
  const pocketPath = useAtomValue(pocketPathAtom)
  return {
    demo: false,
    connect: ({ host, user, password }) =>
      invokeBeginMisterSaveSyncSession(host, user, password),
    heartbeat: () => emit("mister-save-sync-heartbeat"),
    end: () => emit("mister-save-sync-end"),
    useSaves: () => useAtomValue(AllSavesSelector),
    useMisterFolders: (platform) =>
      useAtomValue(MiSTerPlatformsForPocketPlatformSelectorFamily(platform)),
    useMisterSave: (platforms, file) =>
      useAtomValue(MiSTerSaveInfoSelectorFamily({ platforms, file })),
    usePocketSave: (path) =>
      useAtomValue(FileMetadataSelectorFamily({ filePath: path })),
    copyToMister: (path, misterPath) =>
      emit("mister-save-sync-move-save-to-mister", {
        from: `${pocketPath}/Saves/${path}`,
        to: misterPath,
      }),
    copyToPocket: (path, misterPath) =>
      emit("mister-save-sync-move-save-to-pocket", {
        to: `${pocketPath}/Saves/${path}`,
        from: misterPath,
      }),
    useLog: () => {
      const [log, setLog] = useState<string[]>([])
      useEffect(() => {
        const unlisten = listen<string>("mister-save-sync-log", ({ payload }) =>
          setLog((current) => [payload, ...current])
        )
        return () => {
          unlisten.then((stop) => stop())
        }
      }, [])
      return log
    },
  }
}

// ---------- Demo ----------

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.UTC(2026, 9, 16, 12)

/** Pocket saves of the demo, with one case each (see `DEMO_MISTER`). */
const DEMO_POCKET: Record<string, PocketSave> = {
  "gb/Tetris.sav": { crc32: 0x1a2b3c4d, timestamp: NOW - 2 * DAY },
  "gb/Pokemon - Red Version.sav": { crc32: 0x5e6f7a8b, timestamp: NOW - DAY },
  "gbc/Pokemon - Crystal Version.sav": {
    crc32: 0x11223344,
    timestamp: NOW - 10 * DAY,
  },
  "gba/Metroid Fusion.sav": { crc32: 0x99aabbcc, timestamp: NOW - 3 * DAY },
  "genesis/Phantasy Star IV.sav": {
    crc32: 0x01020304,
    timestamp: NOW - 20 * DAY,
  },
  "lynx/California Games.sav": { crc32: 0x0a0b0c0d, timestamp: NOW - DAY },
}

/**
 * The same saves on the "MiSTer": equal (Tetris), older there (Red), newer
 * there (Crystal), missing (Metroid), in one of two folders (Phantasy Star,
 * Genesis / MegaDrive); Lynx isn't mapped.
 */
const DEMO_MISTER: Record<string, MisterSave> = {
  "GAMEBOY/Tetris.sav": { crc32: 0x1a2b3c4d, timestamp: NOW - 2 * DAY },
  "GAMEBOY/Pokemon - Red Version.sav": {
    crc32: 0x0badf00d,
    timestamp: NOW - 6 * DAY,
  },
  "GAMEBOY/Pokemon - Crystal Version.sav": {
    crc32: 0x55667788,
    timestamp: NOW - 2 * DAY,
  },
}

const DEMO_FOLDERS: Record<string, string[]> = {
  gb: ["GAMEBOY"],
  gbc: ["GAMEBOY"],
  gba: ["GBA"],
  genesis: ["Genesis", "MegaDrive"],
}

const demoStateAtom = atom({
  pocket: DEMO_POCKET,
  mister: DEMO_MISTER,
  log: [] as string[],
})

const fileOf = (path: string) => path.split("/").at(-1) ?? path

/**
 * Made-up saves and a pretend MiSTer: connecting fails once for the host
 * "fail", copying changes the demo's data and writes to the log. Nothing
 * leaves the app.
 */
const useDemoSource = (): MisterSource => {
  const setState = useSetAtom(demoStateAtom)
  const log = (message: string) =>
    setState((state) => ({ ...state, log: [message, ...state.log] }))

  return {
    demo: true,
    connect: async ({ host }) => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      const ok = host.trim() !== "" && host.trim() !== "fail"
      log(
        ok ? `Connected to ${host} (demo)` : `Couldn't reach "${host}" (demo)`
      )
      return ok
    },
    heartbeat: () => {},
    end: () => log("Session ended (demo)"),
    useSaves: () => Object.keys(useAtomValue(demoStateAtom).pocket),
    useMisterFolders: (platform) => (platform && DEMO_FOLDERS[platform]) || [],
    useMisterSave: (platforms, file) => {
      const { mister } = useAtomValue(demoStateAtom)
      if (!file) return null
      for (const folder of platforms) {
        const save = mister[`${folder}/${file}`]
        if (save)
          return { ...save, path: `${MISTER_SAVES_ROOT}${folder}/${file}` }
      }
      return null
    },
    usePocketSave: (path) => useAtomValue(demoStateAtom).pocket[path],
    copyToMister: (path, misterPath) =>
      setState((state) => ({
        ...state,
        mister: {
          ...state.mister,
          [misterPath.replace(MISTER_SAVES_ROOT, "")]: {
            ...state.pocket[path],
            timestamp: Date.now(),
          },
        },
        log: [`Copied ${fileOf(path)} to the MiSTer (demo)`, ...state.log],
      })),
    copyToPocket: (path, misterPath) =>
      setState((state) => ({
        ...state,
        pocket: {
          ...state.pocket,
          [path]: {
            crc32:
              state.mister[misterPath.replace(MISTER_SAVES_ROOT, "")]?.crc32 ??
              0,
            timestamp: Date.now(),
          },
        },
        log: [`Copied ${fileOf(path)} to the Pocket (demo)`, ...state.log],
      })),
    useLog: () => useAtomValue(demoStateAtom).log,
  }
}

const MisterSourceContext = createContext<MisterSource | null>(null)

/** The source for the MiSTer Sync inside: the real one, or the demo. */
export const MisterSourceProvider = ({
  demo = false,
  children,
}: {
  demo?: boolean
  children: ReactNode
}) =>
  demo ? (
    <DemoProvider>{children}</DemoProvider>
  ) : (
    <RealProvider>{children}</RealProvider>
  )

const RealProvider = ({ children }: { children: ReactNode }) => (
  <MisterSourceContext value={useRealSource()}>{children}</MisterSourceContext>
)

const DemoProvider = ({ children }: { children: ReactNode }) => (
  <MisterSourceContext value={useDemoSource()}>{children}</MisterSourceContext>
)

export const useMisterSource = () => {
  const source = useContext(MisterSourceContext)
  if (!source) throw new Error("useMisterSource needs a MisterSourceProvider")
  return source
}

export { MISTER_SAVES_ROOT }
