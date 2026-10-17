/** A game's file name without its extension, e.g. "Tetris" for "Tetris.gb". */
export const gameDisplayName = (game: string) => {
  const dot = game.lastIndexOf(".")
  return dot > 0 ? game.substring(0, dot) : game
}
