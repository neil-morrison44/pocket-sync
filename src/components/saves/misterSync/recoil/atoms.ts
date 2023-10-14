import { listen } from "@tauri-apps/api/event"
import { atom } from "recoil"
import { syncToAppLocalDataEffect } from "../../../../recoil/effects"

export const SavesInvalidationAtom = atom<number>({
  key: "SavesInvalidationAtom",
  default: 0,
  effects: [
    ({ setSelf }) => {
      listen("mister-save-sync-moved-save", () => {
        setSelf(Date.now())
      })
    },
  ],
})

export const MiSTerCredsAtom = atom<{
  host: string
  user: string
  password: string
}>({
  key: "MiSTerCredsAtom",
  default: {
    host: "",
    user: "root",
    password: "1",
  },
  effects: [syncToAppLocalDataEffect("mister_creds")],
})

export type MiSTerSaveJoin = { pocket: string; mister: string }

export const DEFAULT_MISTER_SAVE_MAPPING = [
  {
    pocket: "gb",
    mister: "GAMEBOY",
  },
  {
    pocket: "gbc",
    mister: "GAMEBOY",
  },
  {
    pocket: "gba",
    mister: "GBA",
  },
  {
    pocket: "gg",
    mister: "SMS",
  },
  {
    pocket: "sms",
    mister: "SMS",
  },
  {
    pocket: "pce",
    mister: "TGFX16",
  },
  {
    pocket: "pcecd",
    mister: "TGFX16",
  },
  {
    pocket: "pcecd",
    mister: "TGFX16",
  },
  {
    pocket: "sg1000",
    mister: "SG1000",
  },
  { pocket: "arduboy", mister: "Arduboy" },
  { pocket: "genesis", mister: "Genesis" },
  { pocket: "genesis", mister: "MegaDrive" },
  { pocket: "ng", mister: "NEOGEO" },
  { pocket: "nes", mister: "NES" },
  { pocket: "snes", mister: "SNES" },
  { pocket: "supervision", mister: "SuperVision" },
  { pocket: "poke_mini", mister: "PokemonMini" },
  { pocket: "wonderswan", mister: "WonderSwan" },
  { pocket: "gamete", mister: "Gamate" },
] satisfies MiSTerSaveJoin[]

export const saveMappingAtom = atom<MiSTerSaveJoin[]>({
  key: "saveMappingAtom",
  default: DEFAULT_MISTER_SAVE_MAPPING,
  effects: [syncToAppLocalDataEffect("mister_save_mapping")],
})
