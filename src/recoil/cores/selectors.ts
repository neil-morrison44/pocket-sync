import { DefaultValue, selector, selectorFamily } from "recoil"
import { CoreInfoSelectorFamily, coresListSelector } from "../selectors"
import { coreInventoryAtom } from "../inventory/atoms"
import { FileWatchAtomFamily } from "../fileSystem/atoms"
import {
  invokeFileExists,
  invokeReadBinaryFile,
  invokeReadTextFile,
  invokeSaveFile,
} from "../../utils/invokes"
import { JTCrtConfig } from "../../types"
import { pocketPathAtom } from "../atoms"

type UpdateInfo = {
  coreName: string
  installedVersion: string
  latestVersion: string
}

export const installedCoresWithUpdatesSelector = selector<UpdateInfo[]>({
  key: "installedCoresWithUpdatesSelector",
  get: ({ get }) => {
    const installedCores = get(coresListSelector)
    const coreInventory = get(coreInventoryAtom)

    return installedCores
      .map((coreName) => {
        const coreInfo = get(CoreInfoSelectorFamily(coreName))
        const inventoryItem = coreInventory.data.find(
          ({ identifier }) => coreName === identifier
        )
        return {
          coreName,
          installedVersion: coreInfo.core.metadata.version,
          latestVersion: inventoryItem?.version,
        }
      })
      .filter(
        ({ installedVersion, latestVersion }) =>
          latestVersion && installedVersion !== latestVersion
      ) as UpdateInfo[]
  },
})

export const CoreInfoTxtSelectorFamily = selectorFamily<string, string>({
  key: "CoreInfoTxtSelectorFamily",
  get:
    (coreName) =>
    async ({ get }) => {
      const path = `Cores/${coreName}/info.txt`

      get(FileWatchAtomFamily(path))

      const exists = await invokeFileExists(path)

      if (!exists) return ""

      const text = await invokeReadTextFile(path)

      return text
    },
})

export const JT_ANALOGIZER_VIDEO_OPTIONS: [number, JTCrtConfig["video"]][] = [
  [0x820, "RBGS (SCART)"],
  [0xc08, "RGsB"],
  [0xa08, "YPbPr (Component video)"],
  [0x900, "Y/C NTSC (SVideo, Composite video)"],
  [0x980, "Y/C PAL (SVideo, Composite video)"],
  [0x801, "Scandoubler RGBHV (SCANLINES 0%)"],
  [0x803, "Scandoubler RGBHV (SCANLINES 25%)"],
  [0x805, "Scandoubler RGBHV (SCANLINES 50%)"],
  [0x807, "Scandoubler RGBHV (SCANLINES 75%)"],
  [0x000, "Disable Analog Video"],
] as const

export const JT_ANALOGIZER_SNAC_OPTIONS: [number, JTCrtConfig["snac"]][] = [
  [0x00, "None"],
  [0x01, "DB15 Normal"],
  [0x02, "NES"],
  [0x03, "SNES"],
  [0x04, "PCE 2BTN/6BTN"],
  [0x06, "PCE Multitap"],
] as const

const DEFAULT_CRT_CONFIG = {
  video: "Disable Analog Video",
  snac: "None",
} as const

export const JTCRTConfigSelector = selector<JTCrtConfig>({
  key: "JTCRTConfigSelector",
  get: async ({ get }) => {
    const path = "Assets/jtpatreon/common/crtcfg.bin"
    get(FileWatchAtomFamily(path))
    const exists = await invokeFileExists(path)
    if (!exists) return DEFAULT_CRT_CONFIG

    const binary = await invokeReadBinaryFile(path)
    const configValue = new DataView(binary.buffer).getUint32(0, false)

    const videoValue = (configValue >> 20) & 0xfff
    const snacValue = (configValue >> 12) & 0xff

    const video = JT_ANALOGIZER_VIDEO_OPTIONS.find(
      ([key]) => key === videoValue
    )
    const snac = JT_ANALOGIZER_SNAC_OPTIONS.find(([key]) => key === snacValue)

    if (!video || !snac) return DEFAULT_CRT_CONFIG

    return { video: video[1], snac: snac[1] }
  },
  set: ({ get }, newValue) => {
    const pocketPath = get(pocketPathAtom)
    const path = `${pocketPath}/Assets/jtpatreon/common/crtcfg.bin`

    if (newValue instanceof DefaultValue) {
      newValue = DEFAULT_CRT_CONFIG
    }

    const videoValue = JT_ANALOGIZER_VIDEO_OPTIONS.find(
      ([_, value]) => newValue.video === value
    )
    const snacValue = JT_ANALOGIZER_SNAC_OPTIONS.find(
      ([_, value]) => newValue.snac === value
    )

    if (!videoValue) throw new Error(`Non-video value ${newValue.video}`)
    if (!snacValue) throw new Error(`Non-snac value ${newValue.snac}`)

    const configValue = (videoValue[0] << 20) | (snacValue[0] << 12)

    const binary = new Uint8Array(4)
    new DataView(binary.buffer).setUint32(0, configValue, false)

    invokeSaveFile(path, binary)
  },
})
