import { describe, expect, it } from "vitest"
import { semverCompare } from "./semverCompare"

describe("semverCompare", () => {
  it("returns true only when the first version is strictly newer", () => {
    expect(
      [
        ["1.2.0", "1.1.9"],
        ["1.1.9", "1.2.0"],
        ["1.10.0", "1.9.0"],
        ["1.9.0", "1.10.0"],
        ["1.2.3", "1.2.3"],
        ["1.2", "1.2.0"],
        ["v2.0.0", "1.9.9"],
        ["v1.0.0", "2.0.0"],
      ].map(([a, b]) => semverCompare(a, b))
    ).toMatchInlineSnapshot(`
      [
        true,
        false,
        true,
        false,
        false,
        false,
        true,
        false,
      ]
    `)
  })
})
