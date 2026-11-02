import { describe, expect, it } from "vitest"
import { decodeDataParams } from "./decodeDataParams"

describe("decodeDataParams", () => {
  it("decodes the low parameter bits, including string inputs", () => {
    expect(
      [undefined, 0, 1, 2, 4, 8, 16, 31, "12"].map(decodeDataParams)
    ).toMatchInlineSnapshot(`
      [
        {
          "coreSpecific": true,
          "instanceJSON": false,
          "nonVolitileFilename": false,
          "platformIndex": 0,
          "readOnly": false,
          "userReloadable": false,
        },
        {
          "coreSpecific": false,
          "instanceJSON": false,
          "nonVolitileFilename": false,
          "platformIndex": 0,
          "readOnly": false,
          "userReloadable": false,
        },
        {
          "coreSpecific": false,
          "instanceJSON": false,
          "nonVolitileFilename": false,
          "platformIndex": 0,
          "readOnly": false,
          "userReloadable": true,
        },
        {
          "coreSpecific": true,
          "instanceJSON": false,
          "nonVolitileFilename": false,
          "platformIndex": 0,
          "readOnly": false,
          "userReloadable": false,
        },
        {
          "coreSpecific": false,
          "instanceJSON": false,
          "nonVolitileFilename": true,
          "platformIndex": 0,
          "readOnly": false,
          "userReloadable": false,
        },
        {
          "coreSpecific": false,
          "instanceJSON": false,
          "nonVolitileFilename": false,
          "platformIndex": 0,
          "readOnly": true,
          "userReloadable": false,
        },
        {
          "coreSpecific": false,
          "instanceJSON": true,
          "nonVolitileFilename": false,
          "platformIndex": 0,
          "readOnly": false,
          "userReloadable": false,
        },
        {
          "coreSpecific": true,
          "instanceJSON": true,
          "nonVolitileFilename": true,
          "platformIndex": 0,
          "readOnly": true,
          "userReloadable": true,
        },
        {
          "coreSpecific": false,
          "instanceJSON": false,
          "nonVolitileFilename": true,
          "platformIndex": 0,
          "readOnly": true,
          "userReloadable": false,
        },
      ]
    `)
  })

  it("decodes the platform index bits", () => {
    expect(
      [
        Math.pow(2, 24),
        Math.pow(2, 23),
        Math.pow(2, 24) + Math.pow(2, 23),
        // instance JSON + core-specific + platform 1
        16 + 2 + Math.pow(2, 24),
      ].map(decodeDataParams)
    ).toMatchInlineSnapshot(`
      [
        {
          "coreSpecific": false,
          "instanceJSON": false,
          "nonVolitileFilename": false,
          "platformIndex": 1,
          "readOnly": false,
          "userReloadable": false,
        },
        {
          "coreSpecific": false,
          "instanceJSON": false,
          "nonVolitileFilename": false,
          "platformIndex": 2,
          "readOnly": false,
          "userReloadable": false,
        },
        {
          "coreSpecific": false,
          "instanceJSON": false,
          "nonVolitileFilename": false,
          "platformIndex": 3,
          "readOnly": false,
          "userReloadable": false,
        },
        {
          "coreSpecific": true,
          "instanceJSON": true,
          "nonVolitileFilename": false,
          "platformIndex": 1,
          "readOnly": false,
          "userReloadable": false,
        },
      ]
    `)
  })
})
