import { Palette } from "../../../types"
import { useRecoilValue } from "recoil"
import { pocketPathAtom } from "../../../recoil/atoms"
import { invokeSaveFile } from "../../../utils/invokes"

export const useSavePalette = () => {
  const pocketPath = useRecoilValue(pocketPathAtom)

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

    await invokeSaveFile(`${pocketPath}/Assets/gb/common/palettes${name}`, data)
  }
}
