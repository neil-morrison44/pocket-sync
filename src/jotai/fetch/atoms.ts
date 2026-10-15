import { atomWithAppLocalSetting } from "../../utils/jotai"

/**
 * When each fetch source last finished fetching, by `fetchSourceKey`; kept on
 * this computer (the SD card's config has no field for it).
 */
export const fetchLastRunAtom = atomWithAppLocalSetting<Record<string, number>>(
  "fetch_last_run",
  {}
)

/** A stable id for a fetch source: its type, origin and destination. */
export const fetchSourceKey = (origin: string, destination: string) =>
  `${origin}->${destination}`
