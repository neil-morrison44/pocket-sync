type Metadata = {
  author: string
  core: string
  game: string
  platform: string
}

export const getCartridgeBinaryMetadata = (
  buf: Uint8Array,
  atEnd?: boolean
): Metadata => {
  const metadataBuffer = atEnd
    ? buf.slice(buf.length - 528)
    : buf.slice(0x01c, 424)

  const utf8decoder = new TextDecoder()

  const game = utf8decoder
    .decode(metadataBuffer.slice(0, 16 * 20))
    .trim()
    .replaceAll("\u0000", "")

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

  const utf8decoder = new TextDecoder()
  // The unpacking here might not be right if there's unused ranges

  const author = utf8decoder
    .decode(metadataBuffer.slice(0, 16 * 2))
    .replaceAll("\u0000", "")

  const core = utf8decoder
    .decode(metadataBuffer.slice(16 * 2, 16 * 4))
    .trim()
    .replaceAll("\u0000", "")

  const game = utf8decoder
    .decode(metadataBuffer.slice(16 * 6, 16 * 20))
    .trim()
    .replaceAll("\u0000", "")

  const platform = utf8decoder
    .decode(metadataBuffer.slice(metadataBuffer.length - 16 * 10))
    .replaceAll("\u0000", "")

  return {
    author,
    core,
    game,
    platform,
  }
}
