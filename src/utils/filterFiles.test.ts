import { describe, expect, it } from "vitest"
import { filterKnownBadFiles } from "./filterFiles"

describe("filterKnownBadFiles", () => {
  it("removes junk files but keeps real content", () => {
    expect(
      filterKnownBadFiles([
        "Cores/gb/core.json",
        "Cores/gb/gb.soa",
        "__MACOSX/._core.json",
        "Cores/gb/.DS_Store",
        "Cores/.keep",
        "Saves/.gitkeep",
        "Cores/gb/notes.md",
        "Cores/gb/README.txt",
        "Cores/gb/sub/notes.txt",
        "Cores/gb/core.mra",
      ])
    ).toMatchInlineSnapshot(`
      [
        "Cores/gb/core.json",
        "Cores/gb/gb.soa",
        "Cores/gb/README.txt",
        "Cores/gb/sub/notes.txt",
      ]
    `)
  })
})
