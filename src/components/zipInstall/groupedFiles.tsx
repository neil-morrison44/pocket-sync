import { useMemo } from "react"
import { FileTreeNode } from "./types"
import { platform } from "os"
import { useFlattenedTree } from "./hooks"
import { useTranslation } from "react-i18next"

type ZippedCoresProps = {
  tree: FileTreeNode[]
  toggleFiles: (paths: string[]) => void
  allowedFiles: string[] | null
}

type FileGroups = {
  cores: Record<
    string,
    {
      files: string[]
      primaryPlatform: string | null
    }
  >
  platforms: Record<
    string,
    {
      files: string[]
    }
  >
  other: {
    files: string[]
  }
}

export const GroupedFiles = ({
  tree,
  toggleFiles,
  allowedFiles,
}: ZippedCoresProps) => {
  const flattenedFiles = useFlattenedTree(tree)
  const { t } = useTranslation("zip_install")
  const fileGroups = useMemo<FileGroups>(() => {
    let fileGroups: FileGroups = {
      cores: {},
      platforms: {},
      other: { files: [] },
    }

    flattenedFiles.forEach((f) => {
      const { core, platform } = getCoreAndPlatform(f.full)

      if (core && platform) {
        fileGroups.cores[core] ??= { files: [], primaryPlatform: null }
        fileGroups.cores[core].primaryPlatform = platform
        fileGroups.cores[core].files.push(f.full)
      } else if (core) {
        fileGroups.cores[core] ??= { files: [], primaryPlatform: null }
        fileGroups.cores[core].files.push(f.full)
      } else if (platform) {
        fileGroups.platforms[platform] ??= { files: [] }
        fileGroups.platforms[platform].files.push(f.full)
      } else {
        fileGroups.other.files.push(f.full)
      }
    })

    return fileGroups
  }, [flattenedFiles])

  const foldedFileGroups = useMemo<FileGroups>(() => {
    // for each platform where a core's got it as it's primary platform just put it in there
    const folded = structuredClone(fileGroups)

    const platforms = Object.fromEntries(
      Object.entries(folded.platforms).filter(([platform, { files }]) => {
        const foundCore = Object.entries(folded.cores).find(
          ([_core, { primaryPlatform }]) => {
            return primaryPlatform === platform
          }
        )

        if (foundCore) {
          const [_, core] = foundCore
          core.files.push(...files)
          return false
        }
        return true
      })
    )

    return { ...folded, platforms }
  }, [flattenedFiles])

  return (
    <div>
      {Object.keys(foldedFileGroups.cores).length > 1 && (
        <div>
          <div className="zip-install__cores-title">
            {t("grouped_files.cores")}
          </div>
          <div className="zip-install__cores-list">
            {Object.entries(foldedFileGroups.cores).map(
              ([coreName, { files }]) => (
                <FileGroupCheckbox
                  key={coreName}
                  name={coreName}
                  files={files}
                  allowedFiles={allowedFiles}
                  toggleFiles={toggleFiles}
                />
              )
            )}
          </div>
        </div>
      )}
      {Object.keys(foldedFileGroups.platforms).length > 0 && (
        <div>
          <div className="zip-install__cores-title">
            {t("grouped_files.platforms")}
          </div>
          <div className="zip-install__cores-list">
            {Object.entries(foldedFileGroups.platforms).map(
              ([platformName, { files }]) => (
                <FileGroupCheckbox
                  key={platformName}
                  name={platformName}
                  files={files}
                  allowedFiles={allowedFiles}
                  toggleFiles={toggleFiles}
                />
              )
            )}
          </div>
        </div>
      )}
      {/* Don't think this adds much & is confusing when it appears on its own */}
      {/* {foldedFileGroups.other.files.length > 0 && (
        <div>
          <FileGroupCheckbox
            name={t("grouped_files.other")}
            files={foldedFileGroups.other.files}
            allowedFiles={allowedFiles}
            toggleFiles={toggleFiles}
          />
        </div>
      )} */}
    </div>
  )
}

type FileGroupCheckboxProps = {
  name: string
  files: string[]
  allowedFiles: string[] | null
  toggleFiles: (paths: string[]) => void
}

const FileGroupCheckbox = ({
  name,
  files,
  allowedFiles,
  toggleFiles,
}: FileGroupCheckboxProps) => {
  const allFilesAllowed = useMemo(() => {
    return files.every((f) => allowedFiles?.includes(f))
  }, [toggleFiles, allowedFiles, files])

  return (
    <label className="zip-install__cores-label">
      <input
        className="zip-install__cores-checkbox"
        type="checkbox"
        checked={allFilesAllowed}
        onChange={() => toggleFiles(files)}
      />
      {`${name} - ${files.length} Files`}
    </label>
  )
}

const ASSET_FILE_REGEX =
  /(?:Assets|Saves)\/(?<platform>[^/]+)\/(?:common|(?<core>[^/]+))\//

const CORE_FILE_REGEX = /(?:Cores|Settings|Presets)\/(?<core>[^/]+)\//

const IMAGE_FILE_REGEX = /Platforms\/_images\/(?<platform>[^/]+).bin/
const DATA_FILE_REGEX = /Platforms\/(?<platform>[^/]+).json/

const getCoreAndPlatform = (
  filePath: string
): {
  core: string | undefined
  platform: string | undefined
} => {
  const fileMatch =
    filePath.match(ASSET_FILE_REGEX) ||
    filePath.match(CORE_FILE_REGEX) ||
    filePath.match(IMAGE_FILE_REGEX) ||
    filePath.match(DATA_FILE_REGEX)

  if (fileMatch) {
    const { core, platform } = fileMatch.groups as {
      core: string | undefined
      platform: string | undefined
    }
    return { core, platform }
  }

  return { core: undefined, platform: undefined }
}
