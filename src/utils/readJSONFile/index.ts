import { invokeReadTextFile } from "../invokes"
import { parse } from "@prantlf/jsonlint"

export const readJSONFile = async <T>(fileName: string) => {
  const jsonText = await invokeReadTextFile(fileName)

  console.log(fileName, jsonText)
  try {
    return parse(jsonText) as T
  } catch (err: unknown) {
    // @ts-ignore
    const newError = new Error(`${fileName} \n ${err.message}`)

    newError.cause = {
      repairable: true,
      type: "json_error",
      path: fileName,
    }

    throw newError
  }
}
