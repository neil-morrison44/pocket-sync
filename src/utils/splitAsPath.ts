// let PLATFORM: null | Platform = null
// platform().then((p) => (PLATFORM = p))

export const splitAsPath = (filePath: string): string[] => {
  return filePath.split(/\\|\//g).filter(Boolean)
  // Need to support both for some things since hardcoded in-app paths use /
  // if (PLATFORM === "win32"){
  //     return filePath.split("\\").filter(Boolean)
  // } else {
  //     return filePath.split("/").filter(Boolean)
  // }
}
