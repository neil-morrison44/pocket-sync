import { atom } from "jotai"

export const imageModeAtom = atom<"raw" | "upscaled">("upscaled")
