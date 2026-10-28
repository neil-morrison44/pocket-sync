import { describe, expect, it } from "vitest"
import { atom, createStore } from "jotai"
import { keepPreviousOrSuspend, loadable } from "./jotai"

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

function defer<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

describe("loadable", () => {
  it("resolves to hasData when the underlying promise resolves", async () => {
    const source = atom(Promise.resolve(42))
    const a = loadable(source)
    const store = createStore()

    expect(store.get(a)).toEqual({ state: "loading" })

    await flush()
    expect(store.get(a)).toEqual({ state: "hasData", data: 42 })
  })

  it("resolves to hasError when the underlying promise rejects", async () => {
    const error = new Error("boom")
    const source = atom(Promise.reject(error))
    const a = loadable(source)
    const store = createStore()

    expect(store.get(a)).toEqual({ state: "loading" })

    await flush()
    expect(store.get(a)).toEqual({ state: "hasError", error })
  })
})

describe("keepPreviousOrSuspend", () => {
  it("suspends on first load, then keeps the previous value while a refresh is pending", async () => {
    const first = defer<number>()
    const source = atom<Promise<number>>(first.promise)
    const kept = keepPreviousOrSuspend(source)
    const store = createStore()

    // first load: suspends with the promise itself
    expect(store.get(kept)).toBe(first.promise)

    first.resolve(1)
    await flush()
    expect(store.get(kept)).toBe(1)

    // refresh: stays on the previous value instead of suspending
    const second = defer<number>()
    store.set(source, second.promise)
    expect(store.get(kept)).toBe(1)

    second.resolve(2)
    await flush()
    expect(store.get(kept)).toBe(2)
  })

  it("returns the previous reference when a refresh gives an equal value (areEqual)", async () => {
    const first = defer<{ n: number }>()
    const source = atom<Promise<{ n: number }>>(first.promise)
    const kept = keepPreviousOrSuspend(source, (a, b) => a.n === b.n)
    const store = createStore()

    // first read attaches the settle handlers; suspends until resolved
    expect(store.get(kept)).toBe(first.promise)
    first.resolve({ n: 1 })
    await flush()
    const firstValue = store.get(kept)
    expect(firstValue).toEqual({ n: 1 })

    // a refresh resolving to an equal (but different) object must
    // return the previous reference, so dependents don't re-run
    const second = defer<{ n: number }>()
    store.set(source, second.promise)
    second.resolve({ n: 1 })
    await flush()

    expect(store.get(kept)).toBe(firstValue)
  })
})
