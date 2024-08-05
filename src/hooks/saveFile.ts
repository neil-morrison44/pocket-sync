import { save } from "@tauri-apps/plugin-dialog"
import { useCallback } from "react"
import { invokeSaveFile } from "../utils/invokes"

export const useSaveFile = () => {
  const onSaveFile = useCallback(async (name: string, file: File | string) => {
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

    if (!filePath) return

    const buffer = await fileToBuffer(file)
    await invokeSaveFile(filePath, new Uint8Array(buffer))
  }, [])

  return onSaveFile
}

const fileToBuffer = async (file: File | string) => {
  if (typeof file === "string") {
    return fetch(file).then((res) => res.arrayBuffer())
  } else {
    return file.arrayBuffer()
  }
}
