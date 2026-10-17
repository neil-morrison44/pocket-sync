import { startTransition, useCallback } from "react"
import { useSetAtom } from "jotai"

import { currentViewAtom, gamesSearchAtom } from "../jotai/view/atoms"
import { gameDisplayName } from "../utils/gameName"

/**
 * Opens Games searched for one game, e.g. from a screenshot or save state.
 * Stands in for game detail pages until there are any.
 */
export const useOpenGame = () => {
  const setView = useSetAtom(currentViewAtom)
  const setSearch = useSetAtom(gamesSearchAtom)

  return useCallback(
    (game: string) =>
      startTransition(() => {
        setSearch(gameDisplayName(game))
        setView({ view: "Games", selected: null })
      }),
    [setSearch, setView]
  )
}
