import { invoke } from "@tauri-apps/api"

export const invokeOpenPocket = async () => invoke<string | null>("open_pocket")

export const invokeListFiles = async (path: string) =>
  invoke<string[]>("list_files", {
    path,
  })

export const invokeReadTextFile = async (path: string) =>
  invoke<string>("read_text_file", {
    path,
  })

export const invokeReadBinaryFile = async (path: string) =>
  invoke<Uint8Array>("read_binary_file", {
    path,
  })

export const invokeWalkDirListFiles = async (
  path: string,
  extensions: string[]
) =>
  invoke<string[]>("walkdir_list_files", {
    path,
    extensions,
  })

export const invokeSaveFile = async (path: string, buffer: Uint8Array) =>
  invoke<boolean>("save_file", {
    path,
    buffer: Array.prototype.slice.call(buffer),
  })

export const invokeFileExists = async (path: string) =>
  invoke<boolean>("file_exists", {
    path,
  })

export const invokeUninstallCore = async (coreName: string) =>
  invoke<boolean>("uninstall_core", {
    coreName,
  })
