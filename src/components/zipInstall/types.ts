export type FileTreeNode = {
  name: string
  full: string
  exists: boolean
  is_dir: boolean
  children: FileTreeNode[]
}

export type InstallZipEventPayload = {
  title: string
  files?: { path: string; exists: boolean }[]
  progress?: { value: number; max: number }
}

export type ZipReplaceRequestPayload = {
  previous_core_names: string[]
}
