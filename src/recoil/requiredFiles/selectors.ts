import { selectorFamily } from "recoil"
import { RequiredFileInfo, InstanceDataJSON } from "../../types"
import { decodeDataParams } from "../../utils/decodeDataParams"
import {
  invokeFileExists,
  invokeFileMetadata,
  invokeWalkDirListFiles,
} from "../../utils/invokes"
import { readJSONFile } from "../../utils/readJSONFile"
import { IGNORE_INSTANCE_JSON_LIST } from "../../values"
import { fileSystemInvalidationAtom } from "../atoms"
import { skipAlternateAssetsSelector } from "../config/selectors"
import { DataJSONSelectorFamily, CoreInfoSelectorFamily } from "../selectors"

const SingleRequiredFileInfo = selectorFamily<
  RequiredFileInfo,
  { filename: string | undefined; path: string; type: "core" | "instance" }
>({
  key: "SingleRequiredFileInfo",
  get:
    ({ filename, path, type }) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)

      if (!filename) throw new Error("Attempting to find empty file")

      const fullPath = `${path}/${filename}`
      const exists = await invokeFileExists(fullPath)
      const crc32 = exists
        ? (await invokeFileMetadata(fullPath)).crc32
        : undefined

      return {
        filename,
        path,
        exists,
        crc32,
        type,
      }
    },
})

export const RequiredFileInfoSelectorFamily = selectorFamily<
  RequiredFileInfo[],
  string
>({
  key: "DataJSONSelectorFamily",
  get:
    (coreName) =>
    async ({ get }) => {
      const dataJSON = get(DataJSONSelectorFamily(coreName))
      const coreJSON = get(CoreInfoSelectorFamily(coreName))
      const [platform_id] = coreJSON.core.metadata.platform_ids

      const requiredCoreFiles = dataJSON.data.data_slots.filter(
        ({ name, required, filename }) => {
          return (
            // not sure why some bioses aren't required
            (required || name?.toLowerCase().includes("bios")) &&
            filename &&
            coreJSON.core.metadata.platform_ids.length === 1
          )
        }
      )

      const fileInfo = (
        await Promise.all(
          requiredCoreFiles.map(
            async ({ filename, alternate_filenames, parameters }) => {
              const path = `Assets/${platform_id}/${
                decodeDataParams(parameters).coreSpecific ? coreName : "common"
              }`

              return Promise.all(
                [filename, ...(alternate_filenames || [])].map(
                  async (filename) =>
                    get(
                      SingleRequiredFileInfo({ filename, path, type: "core" })
                    )
                )
              )
            }
          )
        )
      ).flat()

      if (IGNORE_INSTANCE_JSON_LIST.includes(coreName)) {
        return [...fileInfo]
      }

      const instanceFileInfo = await Promise.all(
        dataJSON.data.data_slots
          .filter(({ required, parameters }) => {
            return (
              required &&
              decodeDataParams(parameters).instanceJSON &&
              coreJSON.core.metadata.platform_ids.length === 1
            )
          })
          .map(async ({ filename, parameters }) => {
            if (filename) {
              // can't handle this yet
              console.log("is a single filename")
            }

            const path = `Assets/${platform_id}/${
              decodeDataParams(parameters).coreSpecific ? coreName : "common"
            }/`

            let files = await invokeWalkDirListFiles(path, [".json"])

            if (get(skipAlternateAssetsSelector))
              files = files.filter((path) => !path.includes("_alternatives"))

            return await Promise.all(
              files.map(async (f) => {
                const instanceFile = await readJSONFile<InstanceDataJSON>(
                  `${path}/${f}`
                )

                const dataPath = instanceFile.instance.data_path

                return await Promise.all(
                  instanceFile.instance.data_slots.map(
                    async ({ filename, parameters }) => {
                      const path = `Assets/${platform_id}/${
                        decodeDataParams(parameters).coreSpecific
                          ? coreName
                          : "common"
                      }${dataPath ? `/${dataPath}` : ""}`

                      return get(
                        SingleRequiredFileInfo({
                          filename,
                          path,
                          type: "instance",
                        })
                      )
                    }
                  )
                )
              })
            )
          })
      )

      return [...fileInfo, ...instanceFileInfo.flat(3)]
    },
})
