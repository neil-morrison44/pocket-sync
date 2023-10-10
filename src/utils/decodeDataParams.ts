export const decodeDataParams = (rawParams: string | number) => {
  const parms = typeof rawParams === "string" ? Number(rawParams) : rawParams

  return {
    userReloadable: (parms & 1) === 1,
    coreSpecific: (parms & 2) === 2,
    nonVolitileFilename: (parms & 4) === 4,
    readOnly: (parms & 8) === 8,
    instanceJSON: (parms & 0b000010000) === 0b000010000,
  }
}
