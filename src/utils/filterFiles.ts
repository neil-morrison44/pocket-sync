import { splitAsPath } from "./splitAsPath"

export const filterKnownBadFiles = (paths: string[]): string[] =>
  paths.filter((p) => {
    if (p.startsWith("__MACOSX/") || p.endsWith(".DS_Store")) return false
    if (p.endsWith(".keep") || p.endsWith(".gitkeep")) return false
    if (p.endsWith(".md")) return false
    if (splitAsPath(p).length === 1 && p.endsWith(".txt")) return false
    if (p.endsWith(".mra")) return false

    return true
  })
