import { useAtom, useAtomValue, useSetAtom } from "jotai"
import {
  allPlatformsDataSelector,
  PlatformInfoSelectorFamily,
  unpositionedPlatformsSelector,
} from "../../../recoil/platforms/selectors"
import {
  MouseEvent,
  ReactEventHandler,
  startTransition,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react"
import { PlatformImage } from "../../cores/platformImage"
import {
  draggedPlatformIdAtom,
  platformModalBucketFilterAtom,
  platformModalPositionAtom,
} from "../../../recoil/platforms/atoms"
import { useAtomCallback } from "jotai/utils"

export const PlatformsBucket = () => {
  const [platformModalBucketFilter, setPlatformModalBucketFilter] = useAtom(
    platformModalBucketFilterAtom
  )
  const [searchText, setSearchText] = useState<string>("")

  const BUCKET_FILTERS = [
    { id: "all", label: "All" },
    { id: "category", label: "Category" },
    { id: "manufacturer", label: "Manufacturer" },
    { id: "year", label: "Year" },
    { id: "core-author", label: "Core Author" },
  ] as const

  return (
    <div className="platform-loadout__platform-bucket">
      <div className="platform-loadout__platform-bucket-nav">
        <input
          type="search"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
          placeholder="Archived Platforms"
        />
        <div className="platform-loadout__platform-bucket-view-tabs">
          {BUCKET_FILTERS.map(({ id, label }) => (
            <label key={id} className="platform-tab">
              <input
                type="radio"
                name="platform-bucket-filter"
                value={id}
                checked={platformModalBucketFilter === id}
                onChange={() => setPlatformModalBucketFilter(id)}
                className="platform-tab__input"
              />
              <span className="platform-tab__label">{label}</span>
            </label>
          ))}
        </div>
      </div>
      <Suspense
        fallback={<div className="platform-loadout__platform-bucket-content" />}
      >
        <BucketContent searchText={searchText} />
      </Suspense>
    </div>
  )
}

export const BucketContent = ({ searchText }: { searchText: string }) => {
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
      const draggedPlatformId = get(draggedPlatformIdAtom)
      if (draggedPlatformId) {
        startTransition(() =>
          set(platformModalPositionAtom, (ps) =>
            ps.filter(({ id }) => id !== draggedPlatformId)
          )
        )
      }
    }, [])
  )

  return (
    <div
      className="platform-loadout__platform-bucket-content"
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
  const [draggedPlatformId, setDraggedPlatform] = useAtom(draggedPlatformIdAtom)

  const onMouseDown = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      setDraggedPlatform(id)
      event.preventDefault()
    },
    [setDraggedPlatform]
  )

  return (
    <div
      className="platform-loadout__platform-item"
      style={{ opacity: draggedPlatformId === id ? 0.4 : 1 }}
      onMouseDown={onMouseDown}
    >
      {name}
      <PlatformImage
        className="platform-loadout__platform-item-image"
        platformId={id}
      />
    </div>
  )
}
