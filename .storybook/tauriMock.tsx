// A throwaway Tauri IPC mock for stories, shaped like the browser globals
// Tauri injects (window.__TAURI_INTERNALS__). Swap out for something proper
// later.
import type { Decorator } from "@storybook/react"

const POCKET_PLATFORMS = [
  "gb",
  "gbc",
  "gba",
  "sms",
  "gg",
  "nes",
  "snes",
  "genesis",
  "ng",
]

const MISTER_PLATFORMS = [
  "Arduboy",
  "GAMEBOY",
  "GBA",
  "Genesis",
  "MegaDrive",
  "NEOGEO",
  "NES",
  "SG1000",
  "SMS",
  "SNES",
  "SuperVision",
  "TGFX16",
]

type Callback = (data: unknown) => unknown
type TauriInternals = {
  invoke: (
    cmd: string,
    args?: Record<string, unknown>,
    options?: unknown
  ) => Promise<unknown>
  transformCallback: (cb: Callback) => number
  unregisterCallback: (id: number) => void
}

let installed = false

const installTauriMock = () => {
  if (installed) return
  installed = true

  const callbacks = new Map<number, Callback>()
  const listeners = new Map<string, Set<number>>()
  let nextId = 1

  const registerCallback: TauriInternals["transformCallback"] = (cb) => {
    const id = nextId++
    callbacks.set(id, cb)
    return id
  }

  const emitTo = (event: string, payload: unknown) => {
    for (const id of listeners.get(event) ?? []) {
      callbacks.get(id)?.({ event, payload })
    }
  }

  const invoke: TauriInternals["invoke"] = (cmd, args = {}) => {
    switch (cmd) {
      case "plugin:app|version":
        return "7.1.1"

      // fs: pretend the local-storage files don't exist so atoms fall back
      // to their defaults
      case "plugin:fs|exists":
        return false
      case "plugin:fs|write_text_file":
        return null

      case "list_folders":
        return POCKET_PLATFORMS

      case "plugin:log|log":
        return null

      case "plugin:event|listen": {
        const id = args.handler as number
        if (!listeners.has(args.event as string)) {
          listeners.set(args.event as string, new Set())
        }
        listeners.get(args.event as string)!.add(id)
        return id
      }

      case "plugin:event|unlisten": {
        listeners.get(args.event as string)?.delete(args.eventId as number)
        callbacks.delete(args.eventId as number)
        return null
      }

      case "plugin:event|emit": {
        const event = args.event as string
        // the Rust side of the app answers this request on a *different*
        // event, register the response on a later tick so the selector's
        // listener is in place before we deliver
        if (event === "mister-save-sync-list-platforms") {
          setTimeout(() => emitTo("mister-save-sync-platform-list", MISTER_PLATFORMS), 0)
        }
        emitTo(event, args.payload)
        return null
      }

      default:
        console.warn(`[tauriMock] unmocked invoke: ${cmd}`, args)
        return null
    }
  }

  window.__TAURI_INTERNALS__ = {
    invoke,
    transformCallback: registerCallback,
    unregisterCallback: (id) => callbacks.delete(id),
  }

  // `@tauri-apps/api/event`'s unlisten also calls into this global
  window.__TAURI_EVENT_PLUGIN_INTERNALS__ = {
    unregisterListener: () => undefined,
  }
}

export const tauriMockDecorator: Decorator = (Story) => {
  installTauriMock()
  return <Story />
}
