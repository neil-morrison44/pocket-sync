import { invokeReadTextFile } from "../invokes"
import { parse } from "@prantlf/jsonlint"

export const readJSONFile = async <T>(fileName: string) => {
  const jsonText = await invokeReadTextFile(fileName)

  try {
    return parse(jsonText) as T
  } catch (err: unknown) {
    // @ts-ignore
    err.message = `${fileName} \n ${err.message}`
    throw err
  }
}
