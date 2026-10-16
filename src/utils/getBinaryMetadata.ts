type Metadata = {
  author: string
  core: string
  game: string
  platform: string
}

/** Code page 437 (the original IBM PC set) for bytes 0x80–0xFF. */
const CP437_HIGH =
  "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■\u00a0"

/**
 * Decodes a fixed-size text field from a save state or screenshot,
 * ignoring null padding. Text that isn't valid UTF-8 is read as code page
 * 437, which matches what the Pocket stores: "Pokémon" has its "é" as 0x82
 * (Windows-1252 read that as "‚", so it showed "Pok‚mon"). The result is normalised so
 * accents render as one character.
 */
const decodeField = (bytes: Uint8Array) => {
  const field = bytes.filter((byte) => byte !== 0)
  let text: string
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(field)
  } catch {
    text = Array.from(field, (byte) =>
      byte < 0x80 ? String.fromCharCode(byte) : CP437_HIGH[byte - 0x80]
    ).join("")
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
