export const semverCompare = (a: string, b: string) => {
  const [aMajor, aMinor = 0, aPatch = 0] = a
    .replace(/[^0-9.]/g, "")
    .split(".")
    .map((n) => parseInt(n))

  const [bMajor, bMinor = 0, bPatch = 0] = b
    .replace(/[^0-9.]/g, "")
    .split(".")
    .map((n) => parseInt(n))

  if (aMajor > bMajor) return true
  if (aMajor < bMajor) return false

  if (aMinor > bMinor) return true
  if (aMinor < bMinor) return false

  if (aPatch > bPatch) return true
  if (aPatch < bPatch) return false

  return false
}
