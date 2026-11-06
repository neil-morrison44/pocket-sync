import { invokeReadTextFile } from "../invokes"
import { parse } from "@prantlf/jsonlint"

export const readJSONFile = async <T>(fileName: string) => {
  const jsonText = await invokeReadTextFile(fileName)
  try {
    return parse(jsonText) as T
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const newError = new Error(
      `Failed to parse JSON file ${fileName}: ${message}`
    )

    newError.cause = {
      repairable: true,
      type: "json_error",
      path: fileName,
    }

    throw newError
  }
}
