import { atom } from "recoil"

const INTERVAL_MINS = 5

export const newsFeedUpdateAtom = atom<number>({
  key: "newsFeedUpdateAtom",
  default: Date.now(),
  effects: [
    ({ setSelf }) => {
      setInterval(() => {
        setSelf(Date.now())
      }, INTERVAL_MINS * 60 * 1000)
    },
  ],
})
