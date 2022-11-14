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

export type PlatformId = string
export type Category = string
export type AuthorName = string
export type Semver = `${number}.${number}.${number}`

export type PlatformJSON = {
  id: PlatformId
  platform: {
    category: Category
    name: string
    year: number
    manufacturer: string
  }
}

export type CoreInfoJSON = {
  core: {
    magic: "APF_VER_1"
    metadata: {
      platform_ids: PlatformId[]
      shortname: string
      description: string
      author: AuthorName
      url?: string
      version: Semver | string
      date_release: string
    }
    framework: {
      target_product: "Analogue Pocket"
      version_required: string
      sleep_supported: boolean
      dock: {
        supported: boolean
        analog_output: boolean
      }
      hardware: {
        link_port: boolean
        cartridge_adapter: -1 | 0
      }
    }
    cores: {
      name: string
      id: number | string
      filename: string
    }[]
  }
}

export type InventoryJSON = {
  data: InventoryItem[]
}

export type InventoryItem = {
  identifier: string
  platform: PlatformId
  repository: {
    platform: "github" | string
    owner: string
    name: string
  }
  release?: {
    tag_name: Semver | string
    release_date: string
    platform: {
      category: string
      name: string
      manufacturer: string
      year: number
    }
    assets: [
      {
        platform: PlatformId
        filename?: string
        extensions?: string[]
      }
    ]
  }
}

export type GithubRelease = {
  id: number
  tag_name: string
  name: string
  body: string
  draft: boolean
  prerelease: boolean
  created_at: string
  published_at: string
  assets: {
    browser_download_url: string
    name: string
    label: string
    content_type: string
    size: 1024
  }[]
}
