type VersionSting = `${number}.${number}.${number}` | `${number}.${number}`

// return true if b is later than a
export const versionCompare = (a: VersionSting, b: VersionSting): boolean => {
  const aParts = a.split(".").map((s) => parseInt(s))
  const bParts = a.split(".").map((s) => parseInt(s))

  const max = Math.max(aParts.length, bParts.length)

  for (let index = 0; index < max; index++) {
    if (b[index] > a[index]) return true
  }

  return false
}
