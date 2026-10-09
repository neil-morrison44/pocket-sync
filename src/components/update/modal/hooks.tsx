// useUpdateManager.ts
import { useEffect, useReducer } from "react"
import { listen } from "@tauri-apps/api/event"
import prettyBytes from "pretty-bytes"
import { PhaseThreeArgs, UpdateEvent } from "../shared"

type UpdateState = {
  phases: Record<
    "zero" | "one" | "two" | "three",
    "unstarted" | "in_progress" | "finished"
  >
  phaseArgs: {
    one: {
      core_name: null | string
      index: number
      total: number
    }
    three: {
      file_name: string
      core_name: string
      file_bytes: string
      remaining_bytes: string
      index: number
      total: number
    }
  }
  errors: { one: string[]; three: string[] }
  installedCores: Record<
    string,
    { progress: number; height: number; zOffset: number }
  >
  currentEvent: UpdateEvent | null
  phaseThreeCurrentEvent: PhaseThreeArgs | null
}

const initialState: UpdateState = {
  phases: {
    zero: "unstarted",
    one: "unstarted",
    two: "unstarted",
    three: "unstarted",
  },
  phaseArgs: {
    one: { core_name: null, index: 0, total: 0 },
    three: {
      file_name: "",
      core_name: "",
      file_bytes: "0B",
      remaining_bytes: "0B",
      index: 0,
      total: 0,
    },
  },
  errors: { one: [], three: [] },
  installedCores: {},
  currentEvent: null,
}

// 2. Map Tauri events directly to state updates
function updateReducer(state: UpdateState, payload: UpdateEvent): UpdateState {
  switch (payload.type) {
    case "PhaseZeroStartedEvent":
      return {
        ...state,
        phases: { ...state.phases, zero: "in_progress" },
        currentEvent: payload,
      }
    case "PhaseOneStartedEvent":
      return {
        ...state,
        phases: { ...state.phases, zero: "finished" },
        currentEvent: payload,
      }
    case "PhaseOneCoreDownloadProgressEvent":
      return {
        ...state,
        phases: { ...state.phases, one: "in_progress" },
        phaseArgs: {
          ...state.phaseArgs,
          one: {
            core_name: payload.core_name,
            index: payload.core_index + 1,
            total: payload.total_core_count,
          },
        },
        installedCores: {
          ...state.installedCores,
          [payload.core_name]: {
            ...(state.installedCores[payload.core_name] ?? {
              height: Math.random() * 90,
              zOffset: Math.random(),
            }),
            progress: payload.download_progress,
          },
        },
        currentEvent: payload,
      }
    case "PhaseOneErrorEvent":
      return {
        ...state,
        errors: { ...state.errors, one: [...state.errors.one, payload.error] },
      }
    case "PhaseTwoStartedEvent":
      return {
        ...state,
        phases: {
          ...state.phases,
          one: "finished",
          two: "in_progress",
        },
        currentEvent: payload,
      }
    case "PhaseThreeStartedEvent":
      return {
        ...state,
        phases: {
          ...state.phases,
          two: "finished",
        },
        currentEvent: payload,
      }
    case "PhaseThreeDownloadProgressEvent":
      return {
        ...state,
        phases: {
          ...state.phases,
          three: "in_progress",
        },
        phaseArgs: {
          ...state.phaseArgs,
          three: {
            file_name: payload.file_name,
            core_name: payload.core_name,
            file_bytes: prettyBytes(payload.file_bytes),
            index: payload.file_index + 1,
            total: payload.total_file_count,
            remaining_bytes: prettyBytes(payload.remaining_bytes),
          },
        },
        currentEvent: payload,
      }
    case "PhaseThreeErrorEvent":
      return {
        ...state,
        errors: {
          ...state.errors,
          three: [...state.errors.three, payload.error],
        },
      }
    case "Finish":
      return {
        ...state,
        phases: {
          ...state.phases,
          zero: "finished",
          one: "finished",
          two: "finished",
          three: "finished",
        },
        currentEvent: payload,
      }
    default:
      return state
  }
}

export const useUpdateEventManager = () => {
  const [state, dispatch] = useReducer(updateReducer, initialState)

  useEffect(() => {
    const unlisten = listen<UpdateEvent>(
      "install_and_update_cores::update_event",
      ({ payload }) => dispatch(payload)
    )
    return () => {
      unlisten.then((l) => l())
    }
  }, [])

  return state
}
