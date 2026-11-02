import { describe, expect, it } from "vitest"
import { formatDownloadTime } from "./shared"

describe("formatDownloadTime", () => {
  it("returns an empty string for zero or non-finite durations", () => {
    expect(formatDownloadTime(0)).toMatchInlineSnapshot(`""`)
    expect(formatDownloadTime(NaN)).toMatchInlineSnapshot(`""`)
    expect(formatDownloadTime(Infinity)).toMatchInlineSnapshot(`""`)
  })

  it("omits leading zero units", () => {
    expect(formatDownloadTime(59)).toMatchInlineSnapshot(`"59s"`)
    expect(formatDownloadTime(61)).toMatchInlineSnapshot(`"1m 1s"`)
    expect(formatDownloadTime(3600)).toMatchInlineSnapshot(`"1h 0m 0s"`)
    expect(formatDownloadTime(3661)).toMatchInlineSnapshot(`"1h 1m 1s"`)
  })
})
