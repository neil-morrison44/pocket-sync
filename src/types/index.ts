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
    display_modes?: { id: string }[]
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

export type DataSlotJSON = {
  id: number
  name?: string
  required?: boolean
  parameters?: number | string
  extensions?: string[]
  filename?: string
  alternate_filenames?: string[]
  md5?: string
}

export type DataSlotFile = {
  name: string
  path: string
  required: boolean
  status:
    | { type: "Exists" }
    | { type: "NotFound" }
    | { type: "NotChecked" }
    | { type: "FoundAtRoot"; root: RootFileZipped | RootFileUnZipped }
    | { type: "RootNeedsUpdate"; root: RootFileZipped | RootFileUnZipped }
    | { type: "MissingButOnArchive"; url: string; crc32: string }
    | { type: "NeedsUpdateFromArchive"; url: string; crc32: string }
}

export type PlatformId = string
export type Category = string
type AuthorName = string
type Semver = `${number}.${number}.${number}`

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

export type InventoryPlatformsJSON = {
  data: {
    id: PlatformId
    category: string
    name: string
    manufacturer: string
    year: number
  }[]
}

export type InventoryJSON = {
  data: InventoryItem[]
}

export type InventoryItem = {
  id: string
  repository: {
    platform: "github" | string
    owner: string
    name: string
    funding: {
      github?: string[]
      patreon?: string[]
      custon?: string[]
    }
  }
  releases: {
    download_url: string
    requires_license: boolean
    core: Pick<CoreInfoJSON["core"], "metadata" | "framework">
    data: {
      data_slots: {
        name: string
        filename: string
        parameters: {
          core_specific_file: boolean
          instance_json: boolean
          platform_index: number
        }
      }[]
    }
    updaters?: UpdatersJSON
  }[]
}

export type UpdatersJSON = {
  license?: { filename: string }
  previous?: string[]
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
    download_count: number
    name: string
    label: string
    content_type: string
    size: number
  }[]
}

export type FetchType = { type: string; destination: string } & (
  | { type: "archive.org"; name: string; extensions?: string[] }
  | { type: "filesystem"; path: string; extensions?: string[] }
)

export type PocketColour =
  | "white"
  | "black"
  | "glow"
  | "trans_clear"
  | "trans_smoke"
  | "trans_blue"
  | "trans_green"
  | "trans_purple"
  | "trans_orange"
  | "trans_red"
  | "indigo"
  | "red"
  | "green"
  | "blue"
  | "yellow"
  | "pink"
  | "orange"
  | "silver"
  | "aluminium_natural"
  | "aluminium_noir"
  | "aluminium_black"
  | "aluminium_indigo"
  | "gbc_kiwi"
  | "gbc_dandelion"
  | "gbc_teal"
  | "gbc_grape"
  | "gbc_berry"
  | "gbc_gold"

export type PocketSyncConfig = {
  version: string
  colour: PocketColour
  button_colour?: PocketColour
  archive_url: string | null
  saves: SaveConfig[]
  skipAlternateAssets?: boolean
  fetches?: FetchType[]
  patreon_email?: string
  hidden_cores?: string[]
  gb_palette_convert?: boolean
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
  crc32: string
  mtime: string
}

export type FetchFileMetadataWithStatus = {
  name: string
  path: string
  mtime: number
  exists: boolean
}

export type ImagePack = {
  owner: string
  repository: string
  variant: string
  image_platforms: string[]
  data_platforms: string[]
}

export type RawFeedItem = {
  title: string
  link: string
  published: number
  content: string
  categories: [string, string, string]
}

export type FeedItem = {
  type: "new" | "update"
  coreName: string
  published: Date
  content: string
  title: string
  link: string
}

export type FirmwareListItem = {
  version: string
  product: "pocket"
  publishedAt: Date
  url: string
}

export type FirmwareInfo = {
  version: string
  file_size: string
  file_name: string
  md5: string
  download_url?: string
  publishedAt: Date
  release_notes_html: string
}

export type FileCopy = { origin: string; destination: string; exists: boolean }

export type RootFileZipped = {
  crc32: number
  type: "Zipped"
  inner_file: string
  zip_file: string
  md5: string
}

export type RootFileUnZipped = {
  crc32: number
  type: "UnZipped"
  file_name: string
  md5: string
}

export type RootFile = RootFileZipped | RootFileUnZipped

export type FSEvent = {
  attrs: { info?: "mount" }
  paths: string[]
  type:
    | { create: { kind: "folder" | "file" } }
    | { remove: { kind: "folder" | "file" | "other" } }
    | {
        modify:
          | { kind: "data"; mode: "content" }
          | { kind: "rename"; mode: "any" | "both" }
          | { kind: "metadata"; mode: "any" }
          | { kind: "metadata"; mode: "ownership" }
      }
}

export type rgb = [number, number, number]
export type Palette = {
  background: [rgb, rgb, rgb, rgb]
  window: [rgb, rgb, rgb, rgb]
  obj0: [rgb, rgb, rgb, rgb]
  obj1: [rgb, rgb, rgb, rgb]
  off: rgb
}

export type ProgressEvent = {
  finished: boolean
  progress: number
  message?: {
    token: string
    param?: string
  }
}

export type SortMode = "name" | "last_update"

export type Job = { id: string; status: "Running" | "Stopping" }

export type JTCrtConfig = {
  video:
    | "RBGS (SCART)"
    | "RGsB"
    | "YPbPr (Component video)"
    | "Y/C NTSC (SVideo, Composite video)"
    | "Y/C PAL (SVideo, Composite video)"
    | "Scandoubler RGBHV (SCANLINES 0%)"
    | "Scandoubler RGBHV (SCANLINES 25%)"
    | "Scandoubler RGBHV (SCANLINES 50%)"
    | "Scandoubler RGBHV (SCANLINES 75%)"
    | "Disable Analog Video"
  snac:
    | "None"
    | "DB15 Normal"
    | "NES"
    | "SNES"
    | "PCE 2BTN/6BTN"
    | "PCE Multitap"
}

export type PatreonKeyInfo = {
  id: string
  name: string
  url: string
  logo: string
  link: string
}
