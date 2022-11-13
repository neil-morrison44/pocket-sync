export type Screenshot = {
  file_name: string
  file: File
  platform: string
  game: string
  author: string
  core: string
  timestamp: Date
}

export type VideoJSON = {
  video: {
    magic: "APF_VER_1"
    scaler_modes: {
      width: number
      height: number
      aspect_w: number
      aspect_h: number
      rotation: number
      mirror: 0 | 1
    }[]
  }
}

export type ContentView =
  | "Pocket Sync"
  | "Games"
  | "Cores"
  | "Screenshots"
  | "Saves"
