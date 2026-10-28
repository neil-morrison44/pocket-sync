import { describe, expect, it } from "vitest"
import { parsePalette } from "./selectors"

// Pocket .pal files store each layer as 12 bytes: 4 RGB colours, lightest
// first. This is one layer of a_new_palette.pal from a real Pocket card
// (classic DMG greys): 00 00 00 | 20 20 20 | 80 80 80 | ff ff ff

describe("parsePalette", () => {
  it("groups a 12-byte layer into RGB colours and reverses the order", () => {
    expect(
      parsePalette(
        Uint8Array.from([
          0, 0, 0, 0x20, 0x20, 0x20, 0x80, 0x80, 0x80, 0xff, 0xff, 0xff,
        ])
      )
    ).toMatchInlineSnapshot(`
      [
        [
          255,
          255,
          255,
        ],
        [
          128,
          128,
          128,
        ],
        [
          32,
          32,
          32,
        ],
        [
          0,
          0,
          0,
        ],
      ]
    `)
  })

  it("keeps each byte with its own colour", () => {
    expect(
      parsePalette(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]))
    ).toMatchInlineSnapshot(`
      [
        [
          10,
          11,
          12,
        ],
        [
          7,
          8,
          9,
        ],
        [
          4,
          5,
          6,
        ],
        [
          1,
          2,
          3,
        ],
      ]
    `)
  })
})
