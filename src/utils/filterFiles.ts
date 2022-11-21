export const filterKnownBadFiles = (paths: string[]): string[] =>
  paths.filter((p) => {
    if (p.startsWith("__MACOSX/") || p.endsWith(".DS_Store")) return false
    if (p.endsWith(".keep")) return false

    return true
  })
