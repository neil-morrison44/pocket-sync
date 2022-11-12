import { save } from "@tauri-apps/api/dialog"
import { useCallback } from "react"
import { invoke } from "@tauri-apps/api/tauri"

export const useSaveFile = () => {
  const saveFile = useCallback(async (name: string, file: File | string) => {
    const filePath = await save({
      title: "Save screenshot",
      filters: [
        {
          name: "image",
          extensions: ["png"],
        },
      ],
      defaultPath: name,
    })

    const buffer = await fileToBuffer(file)
    await invoke<boolean>("save_file", {
      path: filePath,
      buffer: Array.prototype.slice.call(new Uint8Array(buffer)),
    })
  }, [])

  return saveFile
}

const fileToBuffer = async (file: File | string) => {
  if (typeof file === "string") {
    return fetch(file).then((res) => res.arrayBuffer())
  } else {
    return file.arrayBuffer()
  }
}
