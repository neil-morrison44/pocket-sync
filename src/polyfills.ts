export const installPolyfills = () => {
  if (!Array.prototype.at) {
    Array.prototype.at = function (index: number) {
      if (index >= 0) {
        return this[index]
      } else {
        return this[this.length - index]
      }
    }
  }
}
