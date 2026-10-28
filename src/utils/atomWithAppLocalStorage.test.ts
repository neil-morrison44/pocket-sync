// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { clearMocks, mockIPC } from "@tauri-apps/api/mocks"
import { BaseDirectory } from "@tauri-apps/api/path"
import { createStore } from "jotai"
import { atomWithAppLocalStorage } from "./jotai"

const FILE_NAME = "test-atom"
const FILE_PATH = `${FILE_NAME}.json`
const OPTIONS = { baseDir: BaseDirectory.AppLocalData }

type Call = {
  cmd: string
  args: unknown
  options?: { headers?: Record<string, string> }
}

let calls: Call[]
let fileExists = false
let fileContent = ""

const callsFor = (cmd: string) => calls.filter((call) => call.cmd === cmd)

beforeEach(() => {
  calls = []
  fileExists = false
  fileContent = ""

  mockIPC((cmd) => {
    switch (cmd) {
      case "plugin:fs|exists":
        return fileExists
      case "plugin:fs|read_text_file":
        return new TextEncoder().encode(fileContent)
      case "plugin:fs|write_text_file":
      case "plugin:log|log":
        return undefined
      default:
        throw new Error(`Unexpected IPC call: ${cmd}`)
    }
  })

  // the official mock handler drops `invoke`'s third argument, which is
  // where `write_text_file` passes the path and options - capture it
  const internals = (
    window as {
      __TAURI_INTERNALS__?: {
        invoke: (
          cmd: string,
          args: unknown,
          options?: Call["options"]
        ) => unknown
      }
    }
  ).__TAURI_INTERNALS__
  if (!internals) throw new Error("expected mockIPC to install internals")
  const delegate = internals.invoke
  internals.invoke = (cmd, args, options) => {
    calls.push({ cmd, args, options })
    return delegate(cmd, args, options)
  }
})

afterEach(() => {
  clearMocks()
})

describe("atomWithAppLocalStorage", () => {
  it("returns the initial value when no file exists", async () => {
    const target = atomWithAppLocalStorage(FILE_NAME, { enabled: false })
    const store = createStore()

    expect(await store.get(target)).toEqual({ enabled: false })

    expect(callsFor("plugin:fs|exists")).toEqual([
      {
        cmd: "plugin:fs|exists",
        args: { path: FILE_PATH, options: OPTIONS },
        options: undefined,
      },
    ])
    expect(callsFor("plugin:fs|read_text_file")).toHaveLength(0)
  })

  it("returns the file contents when the file exists", async () => {
    fileExists = true
    fileContent = JSON.stringify({ enabled: true })
    const target = atomWithAppLocalStorage(FILE_NAME, { enabled: false })
    const store = createStore()

    expect(await store.get(target)).toEqual({ enabled: true })

    expect(callsFor("plugin:fs|read_text_file")).toEqual([
      {
        cmd: "plugin:fs|read_text_file",
        args: { path: FILE_PATH, options: OPTIONS },
        options: undefined,
      },
    ])
  })

  it("falls back to the initial value and warns when the file contents are invalid JSON", async () => {
    fileExists = true
    fileContent = "not valid json {"
    const target = atomWithAppLocalStorage(FILE_NAME, { enabled: false })
    const store = createStore()

    expect(await store.get(target)).toEqual({ enabled: false })
    expect(callsFor("plugin:log|log")).toHaveLength(1)
  })

  it("writes pretty-printed JSON and serves later reads from memory", async () => {
    const target = atomWithAppLocalStorage<{ enabled: boolean }>(FILE_NAME, {
      enabled: false,
    })
    const store = createStore()

    await store.set(target, { enabled: true })

    const [write] = callsFor("plugin:fs|write_text_file")
    expect(new TextDecoder().decode(write.args as Uint8Array)).toBe(
      JSON.stringify({ enabled: true }, null, 2)
    )
    expect(write.options).toEqual({
      headers: {
        path: encodeURIComponent(FILE_PATH),
        options: JSON.stringify(OPTIONS),
      },
    })

    // reads after the write come from memory, not the file system
    expect(await store.get(target)).toEqual({ enabled: true })
    expect(callsFor("plugin:fs|exists")).toHaveLength(0)
    expect(callsFor("plugin:fs|read_text_file")).toHaveLength(0)
  })
})
