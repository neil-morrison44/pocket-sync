import { describe, expect, it } from "vitest"
import { DataSlotJSON } from "../types"
import { mergedDataSlots } from "./dataSlotsMerge"

describe("mergedDataSlots", () => {
  it("fills instance slots in from their core counterparts, in instance order", () => {
    const core: DataSlotJSON[] = [
      { id: 1, name: "ROMs", extensions: ["bin", "gba"], filename: "roms.bin" },
      { id: 2, name: "Saves", extensions: ["sav"], filename: "saves.bin" },
      { id: 3, name: "Instance", required: true },
    ]
    const instance: DataSlotJSON[] = [
      { id: 2, filename: "custom.bin" },
      { id: 1 },
      { id: 9 },
    ]

    expect(mergedDataSlots(core, instance)).toMatchInlineSnapshot(`
      [
        {
          "extensions": [
            "sav",
          ],
          "filename": "custom.bin",
          "id": 2,
          "name": "Saves",
        },
        {
          "extensions": [
            "bin",
            "gba",
          ],
          "filename": "roms.bin",
          "id": 1,
          "name": "ROMs",
        },
        {
          "id": 9,
        },
      ]
    `)
  })
})
