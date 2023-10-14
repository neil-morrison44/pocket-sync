import { atom } from "recoil"
import {
  syncToAppLocalDataEffect,
  syncToAppLocalDataEffectDefault,
} from "../effects"

export const alwaysUseEnglishAtom = atom<{ value: boolean }>({
  key: "alwaysUseEnglishAtom",
  default: syncToAppLocalDataEffectDefault("only-use-english", {
    value: false,
  }),
  effects: [syncToAppLocalDataEffect("only-use-english")],
})
