export const calculatePlatformsLimit = (platforms: string[], cores: string[]) => {
  return ((platforms.length * 196) + (cores.length * 4)) > 0x8000
}
