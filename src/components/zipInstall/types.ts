export type FileTreeNode = {
  name: string
  full: string
  exists: boolean
  is_dir: boolean
  children: FileTreeNode[]
  parent: FileTreeNode | null
}

export type InstallZipEventPayload = {
  type: "InstallZipEvent"
  title: string
  files?: { path: string; exists: boolean }[]
  progress?: { value: number; max: number }
}

export type ZipReplaceRequestPayload = {
  type: "ReplaceConfirmEvent"
  previous_core_names: string[]
}
