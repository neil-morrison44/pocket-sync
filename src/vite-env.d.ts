/// <reference types="vite/client" />

declare module "*.hdr" {
  const value: string
  export default value
}

// Allow for virtual module imports
// https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention
declare module "virtual:*"
