export type NavigationKey =
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "End"
  | "Home"

export const isNavigationKey = (key: string): key is NavigationKey =>
  ["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp", "End", "Home"].includes(
    key
  )

// tolerance in px for treating two elements as sitting in the same row
const ROW_TOLERANCE = 2

const centerX = (rect: DOMRect) => rect.left + rect.width / 2

/**
 * Finds the element to move to from `current` based on the on-screen layout,
 * so arrow keys keep working however a grid wraps. Left/right follow the
 * reading order (wrapping across rows); up/down jump to the nearest row above
 * or below and pick the horizontally closest element in it.
 */
export const getSpatialNeighbor = (
  elements: HTMLElement[],
  current: HTMLElement,
  key: NavigationKey
): HTMLElement | undefined => {
  const index = elements.indexOf(current)
  if (index === -1) return elements[0]

  switch (key) {
    case "ArrowLeft":
      return elements[index - 1]
    case "ArrowRight":
      return elements[index + 1]
    case "End":
      return elements[elements.length - 1]
    case "Home":
      return elements[0]
  }

  const from = current.getBoundingClientRect()
  const candidates = elements
    .filter((element) => element !== current)
    .map((element) => ({ element, rect: element.getBoundingClientRect() }))
    .filter(({ rect }) =>
      key === "ArrowDown"
        ? rect.top > from.top + ROW_TOLERANCE
        : rect.top < from.top - ROW_TOLERANCE
    )

  if (candidates.length === 0) return undefined

  // the closest row in the given direction
  const rowTop =
    key === "ArrowDown"
      ? Math.min(...candidates.map(({ rect }) => rect.top))
      : Math.max(...candidates.map(({ rect }) => rect.top))

  const row = candidates.filter(
    ({ rect }) => Math.abs(rect.top - rowTop) <= ROW_TOLERANCE
  )

  row.sort(
    (a, b) =>
      Math.abs(centerX(a.rect) - centerX(from)) -
      Math.abs(centerX(b.rect) - centerX(from))
  )

  return row[0].element
}
