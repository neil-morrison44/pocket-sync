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
import {
  DataJSONSelectorFamily,
  CoreMainPlatformIdSelectorFamily,
  CoreInfoSelectorFamily,
} from "../selectors"
import { mergedDataSlots } from "../../utils/dataSlotsMerge"

const FileInfoSelectorFamily = selectorFamily<
  Omit<RequiredFileInfo, "type">,
  { filename: string | undefined; path: string }
>({
  key: "FileInfoSelectorFamily",
  get:
    ({ filename, path }) =>
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
      }
    },
})

const SingleRequiredFileInfo = selectorFamily<
  RequiredFileInfo,
  {
    filename: string | undefined
    path: string
    md5?: string
    type: "core" | "instance"
  }
>({
  key: "SingleRequiredFileInfo",
  get:
    ({ filename, path, type, md5 }) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const info = get(FileInfoSelectorFamily({ filename, path }))
      return { ...info, md5, type }
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
      const platform_id = get(CoreMainPlatformIdSelectorFamily(coreName))
      const platformIds = get(CoreInfoSelectorFamily(coreName)).core.metadata
        .platform_ids
      const requiredCoreFiles = dataJSON.data.data_slots.filter(
        ({ name, required, filename }) => {
          return (
            // not sure why some bioses aren't required
            (required || name?.toLowerCase().includes("bios")) && filename
          )
        }
      )

      const fileInfo = (
        await Promise.all(
          requiredCoreFiles
            .filter(({ parameters }) => decodeDataParams(parameters).readOnly)
            .map(async ({ filename, alternate_filenames, parameters, md5 }) => {
              const decodedParams = decodeDataParams(parameters)

              const path = `Assets/${
                platformIds[decodedParams.platformIndex]
              }/${decodedParams.coreSpecific ? coreName : "common"}`

              console.log({ path })

              return Promise.all(
                [filename, ...(alternate_filenames || [])].map(
                  async (filename) =>
                    get(
                      SingleRequiredFileInfo({
                        filename,
                        path,
                        md5,
                        type: "core",
                      })
                    )
                )
              )
            })
        )
      ).flat()

      if (IGNORE_INSTANCE_JSON_LIST.includes(coreName)) {
        return [...fileInfo]
      }

      const instanceFileInfo = await Promise.all(
        dataJSON.data.data_slots
          .filter(({ required, parameters }) => {
            return required && decodeDataParams(parameters).instanceJSON
          })
          .map(async ({ filename, parameters }) => {
            if (filename) {
              // still can't handle this yet
              console.log("is a single filename")
            }

            const decodedParams = decodeDataParams(parameters)
            const path = `Assets/${platformIds[decodedParams.platformIndex]}/${
              decodedParams.coreSpecific ? coreName : "common"
            }/`

            console.log({ path })

            let files = await invokeWalkDirListFiles(path, [".json"])
            if (get(skipAlternateAssetsSelector))
              files = files.filter((path) => !path.includes("_alternatives"))

            return await Promise.all(
              files.map(async (f) => {
                const instanceFile = await readJSONFile<InstanceDataJSON>(
                  `${path}/${f}`
                )

                const dataPath = instanceFile.instance.data_path
                const dataSlots = mergedDataSlots(
                  dataJSON.data.data_slots,
                  instanceFile.instance.data_slots
                )

                return await Promise.all(
                  dataSlots
                    // Could do this if cores marked read-only files as readonly
                    // .filter(
                    //   ({ parameters }) => decodeDataParams(parameters).readOnly
                    // )
                    // but they, largely, don't seem to so I'll do
                    .filter(
                      ({ filename }) => !filename || !filename?.endsWith(".sav")
                    )
                    .map(async ({ filename, md5, parameters }) => {
                      const decodedParams = decodeDataParams(parameters)
                      const path = `Assets/${
                        platformIds[decodedParams.platformIndex]
                      }/${decodedParams.coreSpecific ? coreName : "common"}${
                        dataPath ? `/${dataPath}` : ""
                      }`

                      return get(
                        SingleRequiredFileInfo({
                          filename,
                          path,
                          md5,
                          type: "instance",
                        })
                      )
                    })
                )
              })
            )
          })
      )

      return [
        ...fileInfo,
        ...instanceFileInfo
          .flat(3)
          .filter(
            (data, index, arr) =>
              arr.findIndex(
                (d) => d.filename === data.filename && d.path === data.path
              ) === index
          ),
      ]
    },
})
