// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest"
import { clearMocks, mockIPC } from "@tauri-apps/api/mocks"
import { createStore } from "jotai"
import { currentFirmwareVersionSelector } from "./selectors"

// The runtime "byte" in Analogue_Pocket.json encodes the firmware version:
// top nibble = major, second nibble = minor; a "b" prefix means a beta.
// The fixture below is Analogue_Pocket.json from a real Pocket card.
const cardAnaloguePocketJSON = {
  product: "Analogue Pocket",
  firmware: {
    runtime: {
      name: "1.0",
      byte: 183, // 0xb7
      build_date: "2022-10-09",
    },
  },
}

const mockAnaloguePocketJSON = (json: unknown) =>
  mockIPC((cmd) => {
    if (cmd === "read_text_file") return JSON.stringify(json)
    throw new Error(`Unexpected IPC call: ${cmd}`)
  })

afterEach(() => {
  clearMocks()
})

describe("currentFirmwareVersionSelector", () => {
  it("parses a beta firmware byte (real Analogue_Pocket.json)", async () => {
    mockAnaloguePocketJSON(cardAnaloguePocketJSON)
    const store = createStore()

    expect(await store.get(currentFirmwareVersionSelector)).toMatchInlineSnapshot(
      `
      {
        "build_date": "2022-10-09",
        "version": "1.1-beta-7",
      }
    `
    )
  })

  it("parses a release firmware byte", async () => {
    mockAnaloguePocketJSON({
      firmware: {
        runtime: {
          name: "2.5",
          byte: 37, // 0x25
          build_date: "2023-01-01",
        },
      },
    })
    const store = createStore()

    expect(await store.get(currentFirmwareVersionSelector)).toMatchInlineSnapshot(
      `
      {
        "build_date": "2023-01-01",
        "version": "2.5",
      }
    `
    )
  })
})
