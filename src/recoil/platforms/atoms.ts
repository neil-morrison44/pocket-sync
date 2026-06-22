import { atom } from "jotai"
import { PlatformId } from "../../types"

export const platformModalCursorPositonAtom = atom<[number, number]>([0, 0])

export const draggedPlatformsAtom = atom<
  | null
  | { type: "platform"; id: PlatformId }
  | {
      type: "group"
      label: string
      platforms: { id: PlatformId; col: number; row: number }[]
    }
>(null)

export const platformModalBucketFilterAtom = atom<
  "all" | "category" | "manufacturer" | "year"
>("all")

export type PlatformItem = {
  id: PlatformId
  col: number
  row: number
}

export const platformModalPositionAtom = atom<PlatformItem[]>([])

const MAX_ITEMS = 239
const COLS = 12
const ROWS = 20

const getNearestFreeSpace = (
  startCol: number,
  startRow: number,
  occupied: Set<string>
): { col: number; row: number } | null => {
  const queue = [{ col: startCol, row: startRow }]
  const visited = new Set<string>()
  visited.add(`${startCol},${startRow}`)

  // 8 directions (Up, Down, Left, Right, + 4 Diagonals) for a 2D radial search
  const directions = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]

  while (queue.length > 0) {
    const current = queue.shift()!

    if (!occupied.has(`${current.col},${current.row}`)) {
      return current
    }

    for (const [dc, dr] of directions) {
      const nc = current.col + dc
      const nr = current.row + dr

      if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) {
        const key = `${nc},${nr}`
        if (!visited.has(key)) {
          visited.add(key)
          queue.push({ col: nc, row: nr })
        }
      }
    }
  }

  return null
}

export const addPlatformItemsAtom = atom(
  null,
  (get, set, newItems: PlatformItem | PlatformItem[]) => {
    const itemsToAdd = Array.isArray(newItems) ? newItems : [newItems]
    let currentItems = [...get(platformModalPositionAtom)]

    const getOccupiedSet = (items: PlatformItem[]) =>
      new Set(items.map((i) => `${i.col},${i.row}`))

    const clampCol = (col: number) => Math.max(0, Math.min(col, COLS - 1))
    const clampRow = (row: number) => Math.max(0, Math.min(row, ROWS - 1))

    for (const rawItem of itemsToAdd) {
      const newItem = { ...rawItem }
      currentItems = currentItems.filter((i) => i.id !== newItem.id)

      newItem.col = clampCol(newItem.col)
      newItem.row = clampRow(newItem.row)

      const targetKey = `${newItem.col},${newItem.row}`
      const occupiedSet = getOccupiedSet(currentItems)

      if (occupiedSet.has(targetKey)) {
        const displacedItems = currentItems.filter(
          (i) => i.col === newItem.col && i.row === newItem.row
        )

        currentItems = currentItems.filter(
          (i) => i.col !== newItem.col || i.row !== newItem.row
        )

        currentItems.push(newItem)

        const updatedOccupiedSet = getOccupiedSet(currentItems)

        for (const displaced of displacedItems) {
          const freeSpace = getNearestFreeSpace(
            displaced.col,
            displaced.row,
            updatedOccupiedSet
          )

          if (freeSpace) {
            displaced.col = freeSpace.col
            displaced.row = freeSpace.row
            currentItems.push(displaced)

            updatedOccupiedSet.add(`${freeSpace.col},${freeSpace.row}`)
          }
        }
      } else {
        currentItems.push(newItem)
      }
    }

    if (currentItems.length > MAX_ITEMS) {
      currentItems = currentItems.slice(0, MAX_ITEMS)
    }
    set(platformModalPositionAtom, currentItems)
  }
)
