import { Palette } from "../../../types"
import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { pocketPathAtom } from "../../../recoil/atoms"
import {
  invokeConvertSinglePalFile,
  invokeConvertSinglePalFiles,
  invokeSaveFile,
} from "../../../utils/invokes"
import { PocketSyncConfigSelector } from "../../../recoil/config/selectors"

export const useSavePalette = () => {
  const pocketPath = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(pocketPathAtom)
  const config = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    PocketSyncConfigSelector
  )

  return async (palette: Palette, name: string) => {
    const data = new Uint8Array(56)

    ;[...palette.background]
      .reverse()
      .flat()
      .forEach((value, index) => {
        data[index] = value
      })
    ;[...palette.obj0]
      .reverse()
      .flat()
      .forEach((value, index) => {
        data[index + 12] = value
      })
    ;[...palette.obj1]
      .reverse()
      .flat()
      .forEach((value, index) => {
        data[index + 24] = value
      })
    ;[...palette.window]
      .reverse()
      .flat()
      .forEach((value, index) => {
        data[index + 36] = value
      })
    ;[...palette.off].forEach((value, index) => {
      data[index + 48] = value
    })

    data[51] = 0x81
    data[52] = 0x41
    data[53] = 0x50
    data[54] = 0x47
    data[55] = 0x42

    const path = `${pocketPath}/Assets/gb/common/palettes${name}`
    await invokeSaveFile(path, data)
    if (config.gb_palette_convert) await invokeConvertSinglePalFile(path)
  }
}
