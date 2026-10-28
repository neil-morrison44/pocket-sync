import { describe, expect, it } from "vitest"
import { hex16bitSignedToNumber, numberTo16bitSignedHex } from "./hexStrings"

describe("hex16bitSignedToNumber", () => {
  it("treats values >= 2^15 as negative", () => {
    expect(
      ["0x0000", "0x0001", "0x7FFF", "0x8000", "0xFFFF"].map(
        hex16bitSignedToNumber
      )
    ).toMatchInlineSnapshot(`
      [
        0,
        1,
        32767,
        -32768,
        -1,
      ]
    `)
  })
})

describe("numberTo16bitSignedHex", () => {
  it("wraps negatives into 16-bit two's complement hex", () => {
    expect(
      [0, 1, 32767, -32768, -1].map(numberTo16bitSignedHex)
    ).toMatchInlineSnapshot(`
      [
        "0x0000",
        "0x0001",
        "0x7fff",
        "0x8000",
        "0xffff",
      ]
    `)
  })

  it("round-trips with hex16bitSignedToNumber", () => {
    for (const n of [0, 1, 32767, -32768, -1]) {
      expect(hex16bitSignedToNumber(numberTo16bitSignedHex(n))).toBe(n)
    }
  })
})
