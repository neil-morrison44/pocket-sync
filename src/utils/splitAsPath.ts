import {platform, Platform} from "@tauri-apps/api/os"

let PLATFORM: null | Platform  = null
platform().then((p) => PLATFORM = p)

export const splitAsPath = (filePath: string): string[] => {


    return filePath.split(/\\|\//g).filter(Boolean)
    if (PLATFORM === "win32"){
        return filePath.split("\\").filter(Boolean)
    } else {
        return filePath.split("/").filter(Boolean)
    }
}