import { createContext, useContext } from "react"
import { listen } from "@tauri-apps/api/event"

/** Subscribes to an event channel; returns the unsubscribe. */
export type UpdateListen = <T>(
  channel: string,
  handler: (payload: T) => void
) => () => void

/** The backend's events (Tauri), used by a real update. */
const tauriListen: UpdateListen = (channel, handler) => {
  const unlisten = listen<never>(channel, ({ payload }) => handler(payload))
  return () => {
    unlisten.then((stop) => stop())
  }
}

/**
 * Where the update modal gets its progress events: the backend by default,
 * or a scripted demo (Settings → Developer) to preview every phase.
 */
export const UpdateEventsContext = createContext<UpdateListen>(tauriListen)

export const useUpdateListen = () => useContext(UpdateEventsContext)

/** Event channels the update modal listens to. */
export const UPDATE_EVENT = "install_and_update_cores::update_event"
export const REQUIRED_FILES_EVENT = "progress-event::required_files_for_core"

/** An in-memory event channel for the demo: `emit` reaches `listen`. */
export const createDemoEvents = () => {
  const handlers = new Map<string, Set<(payload: never) => void>>()

  const listen: UpdateListen = (channel, handler) => {
    const set = handlers.get(channel) ?? new Set()
    set.add(handler as (payload: never) => void)
    handlers.set(channel, set)
    return () => set.delete(handler as (payload: never) => void)
  }

  const emit = (channel: string, payload: unknown) =>
    handlers.get(channel)?.forEach((handler) => handler(payload as never))

  return { listen, emit }
}
