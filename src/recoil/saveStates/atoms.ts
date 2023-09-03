import { atom } from "recoil"

export type RGB = [number, number, number]
export type ColourMap = [RGB, RGB, RGB, RGB]

export const PhotoColourMapAtom = atom<ColourMap>({
  key: "PhotoColourMapAtom",
  default: [
    [255, 255, 255], //white
    [192, 192, 192], //light grey
    [96, 96, 96], // dark grey
    [0, 0, 0], // black
  ],
})
