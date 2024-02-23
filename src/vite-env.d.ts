/// <reference types="vite/client" />

import "react"

declare module "*.hdr" {
  const value: string
  export default value
}

declare module "*.glb" {
  const value: string
  export default value
}

declare module "*.stl" {
  const value: string
  export default value
}

declare module "*.obj" {
  const value: string
  export default value
}

// Allow for virtual module imports
// https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention
declare module "virtual:*"

declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number
  }
}
