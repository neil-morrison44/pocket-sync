export const calculatePlatformsLimit = (
  platforms: string[],
  cores: string[]
) => {
  return 4096 + platforms.length * 116 + cores.length * 4 > 0x8000
}
