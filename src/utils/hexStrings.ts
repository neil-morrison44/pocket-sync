export const hex16bitSignedToNumber = (hex: string): number => {
  // Parse the hex string as an integer
  const int = parseInt(hex, 16)

  // If the resulting integer is greater than or equal to 2^15, it is a negative number,
  // so we need to subtract 2^16 to get the correct value
  if (int >= Math.pow(2, 15)) {
    return int - Math.pow(2, 16)
  }

  // Otherwise, the integer is already a positive number, so we can just return it as is
  return int
}

export const numberTo16bitSignedHex = (number: number): string => {
  // If the number is negative, we need to add 2^16 to get the correct hex representation
  if (number < 0) {
    number += Math.pow(2, 16)
  }

  // Convert the number to a hex string and pad it with leading zeros if necessary
  let hex = number.toString(16)
  while (hex.length < 4) {
    hex = "0" + hex
  }

  // Return the hex string with a '0x' prefix
  return "0x" + hex
}

export const hex16bitUnsignedToNumber = (hex: string): number => {
  // Parse the hex string as an integer
  const int = parseInt(hex, 16)

  // Return the integer as is, since it is an unsigned value
  return int
}

export const numberToUnsigned16bitHex = (number: number): string => {
  // If the number is negative or greater than 2^16-1, we need to wrap it around to the correct range
  if (number < 0 || number > Math.pow(2, 16) - 1) {
    number %= Math.pow(2, 16)
  }

  // Convert the number to a hex string and pad it with leading zeros if necessary
  let hex = number.toString(16)
  while (hex.length < 4) {
    hex = "0" + hex
  }

  // Return the hex string with a '0x' prefix
  return "0x" + hex
}
