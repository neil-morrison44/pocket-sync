export const installPolyfills = () => {
  if (!Array.prototype.at) {
    Array.prototype.at = function at(n) {
      // ToInteger() abstract op
      n = Math.trunc(n) || 0
      // Allow negative indexing from the end
      if (n < 0) n += this.length
      // OOB access is guaranteed to return undefined
      if (n < 0 || n >= this.length) return undefined
      // Otherwise, this is just normal property access
      return this[n]
    }
  }

  if (!Object.hasOwn) {
    Object.defineProperty(Object, "hasOwn", {
      value: function (object: object, property: string) {
        if (object == null) {
          throw new TypeError("Cannot convert undefined or null to object")
        }
        return Object.prototype.hasOwnProperty.call(Object(object), property)
      },
      configurable: true,
      enumerable: false,
      writable: true,
    })
  }

  // Not sure why but this causes a crash on load on Linux
  if (!screen.orientation){

    Object.defineProperty(screen, "orientation", {value: {
  addEventListener: () => {},
  removeEventListener: () => {}

      },      configurable: true,
      enumerable: false,
      writable: true,
    })}

  
}
