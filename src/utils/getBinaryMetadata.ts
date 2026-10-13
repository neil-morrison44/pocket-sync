type Metadata = {
  author: string
  core: string
  game: string
  platform: string
}

/**
 * Decodes a fixed-size text field from a save state, ignoring null padding.
 * Text that isn't valid UTF-8 (e.g. Latin-1 accents) falls back to
 * Windows-1252, and the result is normalised so accents like "é" render as
 * one character.
 */
const decodeField = (bytes: Uint8Array) => {
  const field = bytes.filter((byte) => byte !== 0)
  let text: string
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(field)
  } catch {
    text = new TextDecoder("windows-1252").decode(field)
  }
  return text.normalize("NFC").trim()
}

export const getCartridgeBinaryMetadata = (
  buf: Uint8Array,
  atEnd?: boolean
): Metadata => {
  const metadataBuffer = atEnd
    ? buf.slice(buf.length - 528)
    : buf.slice(0x01c, 424)

  const game = decodeField(metadataBuffer.slice(0, 16 * 20))

  return {
    author: "Native",
    core: "Native",
    game,
    platform: "Native",
  }
}

export const getBinaryMetadata = (buf: Uint8Array, atEnd?: boolean) => {
  const metadataBuffer = atEnd
    ? buf.slice(buf.length - 528)
    : buf.slice(68, 424)

  // The unpacking here might not be right if there's unused ranges
  const author = decodeField(metadataBuffer.slice(0, 16 * 2))
  const core = decodeField(metadataBuffer.slice(16 * 2, 16 * 4))
  const game = decodeField(metadataBuffer.slice(16 * 6, 16 * 20))
  const platform = decodeField(
    metadataBuffer.slice(metadataBuffer.length - 16 * 10)
  )

  return {
    author,
    core,
    game,
    platform,
  }
}
