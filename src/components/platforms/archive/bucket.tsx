import { useAtom, useAtomValue, useSetAtom } from "jotai"
import {
  allPlatformsDataSelector,
  PlatformInfoSelectorFamily,
  unpositionedPlatformsSelector,
} from "../../../recoil/platforms/selectors"
import {
  MouseEvent,
  Suspense,
  useCallback,
  useMemo,
  useState,
  useTransition,
} from "react"
import { PlatformImage } from "../../cores/platformImage"
import {
  draggedPlatformsAtom,
  platformModalBucketFilterAtom,
  platformModalPositionAtom,
} from "../../../recoil/platforms/atoms"
import { useAtomCallback } from "jotai/utils"
import { PlatformId } from "../../../types"
import { useTranslation } from "react-i18next"

export const PlatformsBucket = () => {
  const [platformModalBucketFilter, setPlatformModalBucketFilter] = useAtom(
    platformModalBucketFilterAtom
  )
  const [searchText, setSearchText] = useState<string>("")
  const { t } = useTranslation("platforms")

  const BUCKET_FILTERS = ["all", "category", "manufacturer", "year"] as const

  const setPlatformPostions = useSetAtom(platformModalPositionAtom)

  return (
    <div className="platform-archive__platform-bucket">
      <div className="platform-archive__platform-bucket-nav">
        <input
          type="search"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
          placeholder={t("archive.search_placeholder")}
        />
        <div
          className="platform-archive__archive-all-button"
          onClick={() => setPlatformPostions([])}
        >
          {t("archive.archive_all")}
        </div>
        <div className="platform-archive__platform-bucket-view-tabs">
          {BUCKET_FILTERS.map((id) => (
            <label key={id} className="platform-tab">
              <input
                type="radio"
                name="platform-bucket-filter"
                value={id}
                checked={platformModalBucketFilter === id}
                onChange={() => setPlatformModalBucketFilter(id)}
                className="platform-tab__input"
              />
              <span className="platform-tab__label">
                {t(`archive.filters.${id}`)}
              </span>
            </label>
          ))}
        </div>
      </div>
      <Suspense
        fallback={<div className="platform-archive__platform-bucket-content" />}
      >
        {platformModalBucketFilter === "all" ? (
          <BucketContentIndividualPlatforms searchText={searchText} />
        ) : (
          <BucketContentGroups searchText={searchText} />
        )}
      </Suspense>
    </div>
  )
}

export const BucketContentGroups = ({ searchText }: { searchText: string }) => {
  const platformData = useAtomValue(allPlatformsDataSelector)
  const unpositonedPlatforms = useAtomValue(unpositionedPlatformsSelector)
  const [isPending, startTransition] = useTransition()

  const allPlatforms = useMemo(() => {
    return [
      ...Object.entries(platformData.active),
      ...Object.entries(platformData.archived),
    ]
      .filter(([id, _data]) => unpositonedPlatforms.includes(id))
      .map(([id, data]) => ({ id, ...data }))
      .toSorted((a, b) => a.name.localeCompare(b.name))
  }, [unpositonedPlatforms, platformData])

  const platformModalBucketFilter = useAtomValue(platformModalBucketFilterAtom)

  const groups = useMemo(() => {
    return Object.groupBy(allPlatforms, (p) => {
      switch (platformModalBucketFilter) {
        case "category":
        case "manufacturer":
        case "year":
          return p[platformModalBucketFilter] ?? ""
        default:
          return "id"
      }
    })
  }, [allPlatforms, platformModalBucketFilter])

  const filteredGroups = useMemo(() => {
    if (searchText.length === 0) return groups
    return Object.fromEntries(
      Object.entries(groups).filter(([name, _data]) =>
        name.toLowerCase().includes(searchText.toLowerCase())
      )
    )
  }, [groups, searchText])

  const onMouseUp = useAtomCallback(
    useCallback((get, set) => {
      const draggedItem = get(draggedPlatformsAtom)
      if (draggedItem) {
        startTransition(() => {
          switch (draggedItem.type) {
            case "platform": {
              set(platformModalPositionAtom, (ps) =>
                ps.filter(({ id }) => id !== draggedItem.id)
              )
              break
            }
            case "group": {
              set(platformModalPositionAtom, (ps) =>
                ps.filter(
                  ({ id }) =>
                    !draggedItem.platforms
                      .map(({ id: pId }) => pId)
                      .includes(id)
                )
              )
              break
            }
          }
        })
      }
    }, [])
  )

  return (
    <div
      className="platform-archive__platform-bucket-content"
      onMouseUp={onMouseUp}
    >
      {Object.entries(filteredGroups).map(([label, platforms]) => {
        const packedPositions = getContiguousPositions(platforms?.length || 0)

        return (
          <GroupedPlatformsItem
            key={label}
            label={label}
            platforms={(platforms ?? []).map((p, index) => ({
              id: p.id,
              col: packedPositions[index].col,
              row: packedPositions[index].row,
            }))}
          />
        )
      })}
    </div>
  )
}

type GroupedPlatformsItemProps = {
  label: string
  platforms: { id: PlatformId; col: number; row: number }[]
}
const GroupedPlatformsItem = ({
  label,
  platforms,
}: GroupedPlatformsItemProps) => {
  const [draggedPlatform, setDraggedPlatform] = useAtom(draggedPlatformsAtom)

  const onMouseDown = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      setDraggedPlatform({ type: "group", label, platforms })
      event.preventDefault()
    },
    [platforms, setDraggedPlatform]
  )
  const gridMaxColumn = Math.max(...platforms.map(({ col }) => col))
  const gridMaxRow = Math.max(...platforms.map(({ row }) => row))

  return (
    <div
      className="platform-archive__platform-group"
      onMouseDown={onMouseDown}
      style={{
        opacity:
          draggedPlatform?.type === "group" && draggedPlatform.label === label
            ? 0.4
            : 1,
      }}
    >
      <PlatformGrid platforms={platforms} />
      {label}
    </div>
  )
}

export const PlatformGrid = ({
  platforms,
}: {
  platforms: { id: string; col: number; row: number }[]
}) => {
  const gridMaxColumn = Math.max(...platforms.map(({ col }) => col))
  const gridMaxRow = Math.max(...platforms.map(({ row }) => row))

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${gridMaxColumn + 1}, 80px)`,
        gridTemplateRows: `repeat(${gridMaxRow + 1}, 26px)`, // Adjusted for ~3:1 aspect ratio
        gap: "4px", // Added gap to distinguish items
      }}
    >
      {platforms.map((p) => {
        return (
          <div
            key={p.id}
            style={{
              gridRow: p.row + 1, // CSS grid is 1-indexed
              gridColumn: p.col + 1,
              width: "100%",
              height: "100%",
              overflow: "hidden", // Ensures the image respects the cell
              borderRadius: "3px",
            }}
          >
            <PlatformImage
              platformId={p.id}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover", // Prevents squishing
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

export const BucketContentIndividualPlatforms = ({
  searchText,
}: {
  searchText: string
}) => {
  const platformData = useAtomValue(allPlatformsDataSelector)
  const unpositonedPlatforms = useAtomValue(unpositionedPlatformsSelector)
  const [isPending, startTransition] = useTransition()

  const allPlatforms = useMemo(() => {
    return [
      ...Object.entries(platformData.active),
      ...Object.entries(platformData.archived),
    ]
      .filter(([id, _data]) => unpositonedPlatforms.includes(id))
      .map(([id, data]) => ({ id, ...data }))
      .toSorted((a, b) => a.name.localeCompare(b.name))
  }, [unpositonedPlatforms, platformData])

  const filteredPlatforms = useMemo(() => {
    if (searchText.length === 0) return allPlatforms
    return allPlatforms.filter(({ name }) =>
      name.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [allPlatforms, searchText])

  const onMouseUp = useAtomCallback(
    useCallback((get, set) => {
      const draggedPlatformId = get(draggedPlatformsAtom)
      if (draggedPlatformId) {
        startTransition(() =>
          set(platformModalPositionAtom, (ps) =>
            ps.filter(({ id }) => {
              if (draggedPlatformId.type === "platform") {
                return id !== draggedPlatformId.id
              } else {
                return !draggedPlatformId.platforms
                  .map(({ id }) => id)
                  .includes(id)
              }
            })
          )
        )
      }
    }, [])
  )

  return (
    <div
      className="platform-archive__platform-bucket-content"
      onMouseUp={onMouseUp}
    >
      {filteredPlatforms.map((p) => (
        <IndividualPlatformItem key={p.id} {...p} />
      ))}
    </div>
  )
}

type IndividualPlatformItemProps = {
  id: string
  category?: string
  name: string
  year: number
}

const IndividualPlatformItem = ({ id, name }: IndividualPlatformItemProps) => {
  const [draggedPlatform, setDraggedPlatform] = useAtom(draggedPlatformsAtom)

  const onMouseDown = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      setDraggedPlatform({ type: "platform", id })
      event.preventDefault()
    },
    [setDraggedPlatform]
  )

  return (
    <div
      className="platform-archive__platform-item"
      style={{
        opacity:
          draggedPlatform?.type === "platform" && draggedPlatform.id === id
            ? 0.4
            : 1,
      }}
      onMouseDown={onMouseDown}
    >
      {name}
      <PlatformImage
        className="platform-archive__platform-item-image"
        platformId={id}
      />
    </div>
  )
}

const getContiguousPositions = (count: number) => {
  const positions: { col: number; row: number }[] = []
  const queue = [{ col: 0, row: 0 }]
  const visited = new Set<string>(["0,0"])

  // Search directions: Right, Down, Left, Up
  const directions = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ]

  while (positions.length < count) {
    const current = queue.shift()!
    positions.push(current)

    for (const [dc, dr] of directions) {
      const nc = current.col + dc
      const nr = current.row + dr
      const key = `${nc},${nr}`

      if (!visited.has(key)) {
        visited.add(key)
        queue.push({ col: nc, row: nr })
      }
    }
  }

  // CSS Grid can't handle negative starting lines easily,
  // so we normalize the shape's bounding box to start at [0, 0]
  const minCol = Math.min(...positions.map((p) => p.col))
  const minRow = Math.min(...positions.map((p) => p.row))

  return positions.map((p) => ({
    col: p.col - minCol,
    row: p.row - minRow,
  }))
}
