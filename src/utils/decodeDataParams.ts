export const decodeDataParams = (rawParams: string | number | undefined) => {
  if (rawParams === undefined) {
    return {
      userReloadable: false,
      coreSpecific: true,
      nonVolitileFilename: false,
      readOnly: false,
      instanceJSON: false,
      platformIndex: 0,
    }
  }

  const parms = typeof rawParams === "string" ? Number(rawParams) : rawParams

  const platformIndex = [
    (parms & Math.pow(2, 24)) === Math.pow(2, 24),
    (parms & Math.pow(2, 23)) === Math.pow(2, 23),
  ].reduce((acc, value, index) => {
    const zeroOrOne = value ? 1 : 0
    return acc + zeroOrOne * (index + 1)
  }, 0)

  const decoded = {
    userReloadable: (parms & 1) === 1,
    coreSpecific: (parms & 2) === 2,
    nonVolitileFilename: (parms & 4) === 4,
    readOnly: (parms & 8) === 8,
    instanceJSON: (parms & 0b000010000) === 0b000010000,
    platformIndex,
  }
  return decoded
}
