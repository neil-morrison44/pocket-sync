type InteractItem = {
  name: string
  id: number | string // 16 bit unsigned number / hex string
  type: "radio" | "check" | "slider_u32" | "list" | "number_u32" | "action"
  enabled: boolean
  address: number | string // 32 bit address / hex string
  persist?: boolean | never
} & (
  | {
      type: "radio"
      group: number | string
      persist?: boolean
      writeonly?: boolean
      defaultval?: 0 | 1 | string
      value: number | string
      value_off?: number | string
      mask?: number | string
    }
  | {
      type: "check"
      persist?: boolean
      writeonly?: boolean
      defaultval: 0 | 1 | string
      value: number | string
      value_off?: number | string
      mask?: number | string
    }
  | {
      type: "slider_u32"
      persist?: boolean
      writeonly?: boolean
      defaultval: number | string
      mask?: number | string
      graphical: {
        signed?: boolean
        min: number | string // -2147483648 to 2147483647
        max: number | string // -2147483648 to 2147483647
        adjust_small: number | string // -2147483648 to 2147483647
        adjust_large: number | string // -2147483648 to 2147483647
      }
    }
  | {
      type: "list"
      writeonly: boolean
      persist: boolean
      defaultval: number | string
      mask?: number | string
      options: { value: number | string; name: string }[]
    }
  | {
      type: "action"
      value: number | string
      mask?: number | string
      persist: never
    }
  | {
      type: "number_u32"
    }
  | {
      type: "action"
    }
)

export type InteractJSON = {
  interact: {
    magic: "APF_VER_1"
    variables: InteractItem[]
  }
}

export type InteractPersistJSON = {
  interact_persist: {
    magic: "APF_VER_1"
    variables: {
      id: number | string
      type: "radio" | "check" | "slider_u32" | "list" | "number_u32"
      val: number | string
    }[]
  }
}
