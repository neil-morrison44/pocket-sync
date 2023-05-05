import { StructuredText } from "react-datocms/structured-text"

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

export type DataJSON = {
  data: {
    magic: "APF_VER_1"
    data_slots: DataSlotJSON[]
  }
}

export type InstanceDataJSON = {
  instance: {
    data_path?: string
    data_slots: DataSlotJSON[]
  }
}

type DataSlotJSON = {
  name?: string
  required?: boolean
  parameters: number | string
  extensions?: string[]
  filename?: string
  alternate_filenames?: string[]
}

export type RequiredFileInfo = {
  filename: string
  path: string
  exists: boolean
  type: "core" | "instance"
  crc32?: number
  status?: "ok" | "wrong" | "downloadable" | "not-in-archive"
}

export type PlatformId = string
export type Category = string
export type AuthorName = string
export type Semver = `${number}.${number}.${number}`

export type PlatformInfoJSON = {
  platform: {
    category?: Category
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

export type InputKey =
  | "pad_btn_a"
  | "pad_btn_b"
  | "pad_btn_x"
  | "pad_btn_y"
  | "pad_trig_l"
  | "pad_trig_r"
  | "pad_btn_start"
  | "pad_btn_select"

export type InputJSON = {
  input: {
    magic: "APF_VER_1"
    controllers?: {
      type: "default"
      mappings: {
        id: number | string
        name: string
        key: InputKey
      }[]
    }[]
  }
}

export type InventoryJSON = {
  data: InventoryItem[]
}

export type InventoryItem = {
  identifier: string
  platform_id: PlatformId
  repository: {
    platform: "github" | string
    owner: string
    name: string
  }
  release_date: string
  download_url: string
  version: Semver | string
  sponsor?: {
    [k: string]: [string] | string
  }
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

export type GithubRelease = {
  html_url: string
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

export type InstallDetails = {
  success: boolean
  files: { path: string; exists: boolean }[]
}

export type PocketSyncConfig = {
  version: string
  colour: "white" | "black"
  archive_url: string | null
  saves: SaveConfig[]
  skipAlternateAssets?: boolean
}

export type SaveConfig = {
  type: "zip"
  backup_location: string
  backup_count: number
}

export type SaveZipFile = {
  filename: string
  last_modified: number
  crc32: number
}

export type ArchiveFileMetadata = {
  name: string
  size: string
  md5: string
  crc32: string
  sha1: string
}

export type ImagePack = {
  owner: string
  repository: string
  variant?: string
}

export type RawFeedItem = {
  title: string
  link: string
  published: number
  content: string
  categories: ["feed", AuthorName, string, "new" | "update"]
}

export type FeedItem = {
  type: "new" | "update"
  coreName: string
  published: Date
  content: string
  title: string
  link: string
}

export type FirmwareInfo = {
  version: VersionSting
  filename: string
  filesize: string
  md5_hash: string
  url: string
  publishedAt?: string
}

export type VersionSting =
  | `${number}.${number}.${number}`
  | `${number}.${number}`

export type StructuredTextFormat = React.ComponentProps<
  typeof StructuredText
>["data"]
