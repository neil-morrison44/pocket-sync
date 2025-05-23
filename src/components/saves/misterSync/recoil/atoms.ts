import { listen } from "@tauri-apps/api/event"
import { atom } from "jotai"
import { withAtomEffect } from "jotai-effect"
import { atomWithAppLocalStorage } from "../../../../utils/jotai"

const BaseSavesInvalidationAtom = atom<number>(0)

export const SavesInvalidationAtom = withAtomEffect(
  BaseSavesInvalidationAtom,
  (get, set) => {
    const unlisten = listen("mister-save-sync-moved-save", () => {
      set(BaseSavesInvalidationAtom, Date.now())
    })

    return () => unlisten.then((l) => l())
  }
)

export const MiSTerCredsAtom = atomWithAppLocalStorage("mister_creds", {
  host: "",
  user: "root",
  password: "1",
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

export const saveMappingAtom = atomWithAppLocalStorage<MiSTerSaveJoin[]>(
  "mister_save_mapping",
  DEFAULT_MISTER_SAVE_MAPPING
)
