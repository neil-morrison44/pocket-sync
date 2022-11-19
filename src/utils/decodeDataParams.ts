export const decodeDataParams = (rawParams: string | number) => {
  const parms = typeof rawParams === "string" ? Number(rawParams) : rawParams

  return {
    userReloadable: (parms & 1) === 1,
    coreSpecific: (parms & 2) === 2,
    nonVolitileFilename: (parms & 0b000000100) === 0b000000100,
    readOnly: (parms & 0b000001000) === 0b000001000,
    instanceJSON: (parms & 0b000010000) === 0b000010000,
  }
}
