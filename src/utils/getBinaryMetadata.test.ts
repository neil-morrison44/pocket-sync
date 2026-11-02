import { describe, expect, it } from "vitest"
import {
  getBinaryMetadata,
  getCartridgeBinaryMetadata,
} from "./getBinaryMetadata"

const place = (buf: Uint8Array, offset: number, text: string) =>
  buf.set(new TextEncoder().encode(text), offset)

// Real Pocket metadata layout (verified against actual .sta save states and
// screenshot PNGs from a Pocket SD card): fields sit on a 32-byte grid
// starting at byte 68 of a save state (or the last 528 bytes of a
// screenshot): author @ +0, core @ +32, version @ +64, game @ +96, platform
// id @ +352, platform name @ +368. The code reads the first 356 bytes, so
// `platform` comes from the id slot ("gb", "gba") and the name ("Game Boy")
// sits outside the slice — the fixtures below pin both of those.

describe("getBinaryMetadata", () => {
  it("reads a real save-state header, using the platform id not name", () => {
    const buf = new Uint8Array(492)
    place(buf, 68, "Spiritualized")
    place(buf, 100, "GB")
    place(buf, 132, "1.3.0") // version slot - between core and game, must not leak
    place(buf, 164, "SUPER MARIOLAND.gb")
    place(buf, 420, "gb")
    place(buf, 436, "Game Boy") // platform name - outside the slice

    expect(getBinaryMetadata(buf)).toMatchInlineSnapshot(`
      {
        "author": "Spiritualized",
        "core": "GB",
        "game": "SUPER MARIOLAND.gb",
        "platform": "gb",
      }
    `)
  })

  it("reads the trailing metadata block when atEnd", () => {
    const buf = new Uint8Array(1024)
    const start = 1024 - 528
    place(buf, start, "agg23")
    place(buf, start + 32, "SNES")
    place(buf, start + 64, "0.3.2") // version slot - must not leak
    place(
      buf,
      start + 96,
      "Chrono Trigger - Bugfix and Uncensoring (Chrono Trigger modification) (Rebuilt Fb) (Bugfix, SkyDark, Name Liberties & Aerdan Item Names).sfc"
    )
    place(buf, start + 356, "snes") // extension slot - must not leak into platform
    place(buf, start + 372, "SNES")

    expect(getBinaryMetadata(buf, true)).toMatchInlineSnapshot(`
      {
        "author": "agg23",
        "core": "SNES",
        "game": "Chrono Trigger - Bugfix and Uncensoring (Chrono Trigger modification) (Rebuilt Fb) (Bugfix, SkyDark, Name Liberties & Aerdan Item Names).sfc",
        "platform": "SNES",
      }
    `)
  })
})

describe("getCartridgeBinaryMetadata", () => {
  it("reads the game name at 0x1c and reports Native for the rest", () => {
    const buf = new Uint8Array(424)
    place(buf, 0x1c, "Cartridge Game")

    expect(getCartridgeBinaryMetadata(buf)).toMatchInlineSnapshot(`
      {
        "author": "Native",
        "core": "Native",
        "game": "Cartridge Game",
        "platform": "Native",
      }
    `)
  })

  it("reads the game name from the trailing block when atEnd", () => {
    const buf = new Uint8Array(1024)
    place(buf, 1024 - 528, "End Game")

    expect(getCartridgeBinaryMetadata(buf, true)).toMatchInlineSnapshot(`
      {
        "author": "Native",
        "core": "Native",
        "game": "End Game",
        "platform": "Native",
      }
    `)
  })
})
