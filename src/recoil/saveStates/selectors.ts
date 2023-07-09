import { selector, selectorFamily } from "recoil"
import { decodeThumbnail } from "../../utils/decodeSaveStateThumbnail"
import {
  getBinaryMetadata,
  getCartridgeBinaryMetadata,
} from "../../utils/getBinaryMetadata"
import {
  invokeReadBinaryFile,
  invokeWalkDirListFiles,
} from "../../utils/invokes"
import { fileSystemInvalidationAtom } from "../atoms"

export const AllSaveStatesSelector = selector<string[]>({
  key: "AllSaveStatesSelector",
  get: async ({ get }) => {
    get(fileSystemInvalidationAtom)
    const saves = await invokeWalkDirListFiles("Memories/Save States", [".sta"])
    return saves.map((f) => f.replace(/^\//g, ""))
  },
})

const SaveStateBinarySelectorFamily = selectorFamily<Uint8Array, string>({
  key: "SaveStateBinarySelectorFamily",
  get: (path) => async () => {
    const file = await invokeReadBinaryFile(`Memories/Save States/${path}`)
    return file
  },
})

export const SaveStateImageSelectorFamily = selectorFamily<string, string>({
  key: "SaveStateImageSelectorFamily",
  get:
    (path) =>
    async ({ get }) => {
      const binary = get(SaveStateBinarySelectorFamily(path))
      const imageSrc = decodeThumbnail(binary)
      return imageSrc
    },
})

export const SaveStateMetadataSelectorFamily = selectorFamily<
  { author: string; core: string; game: string; platform: string },
  string
>({
  key: "SaveStateMetadataSelectorFamily",
  get:
    (path) =>
    async ({ get }) => {
      const binary = get(SaveStateBinarySelectorFamily(path))
      const metadata = !path.includes("/")
        ? getCartridgeBinaryMetadata(binary, false)
        : getBinaryMetadata(binary)
      return metadata
    },
})
