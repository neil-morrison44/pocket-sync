import { atom } from "recoil"

export const paletteRepoAtom = atom<string>({
  key: "paletteRepoAtom",
  default: "davewongillies/openfpga-palettes",
})
