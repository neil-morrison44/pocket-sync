import { describe, expect, it } from "vitest"
import { splitAsPath } from "./splitAsPath"

describe("splitAsPath", () => {
  it("splits on both / and \\ and drops empty segments", () => {
    expect(
      [
        "Cores/gb/core.json",
        "Cores\\gb\\core.json",
        "a/b\\c",
        "//leading/trailing/",
      ].map(splitAsPath)
    ).toMatchInlineSnapshot(`
      [
        [
          "Cores",
          "gb",
          "core.json",
        ],
        [
          "Cores",
          "gb",
          "core.json",
        ],
        [
          "a",
          "b",
          "c",
        ],
        [
          "leading",
          "trailing",
        ],
      ]
    `)
  })
})
