import { useSetRecoilState } from "recoil"
import { Modal } from "../modal"
import { PocketSyncConfigSelector } from "../../recoil/config/selectors"
import { useCallback, useMemo, useState } from "react"
import { FetchType } from "../../types"

type NewFetchProps = {
  onClose: () => void
}

export const NewFetch = ({ onClose }: NewFetchProps) => {
  const setConfig = useSetRecoilState(PocketSyncConfigSelector)

  const addFetch = useCallback(
    (newFetch: FetchType) => {
      setConfig((conf) => ({
        ...conf,
        fetches: [...(conf.fetches || []), newFetch],
      }))
    },
    [setConfig]
  )
  const [fetchType, setFetchType] = useState<FetchType["type"] | null>(null)

  return (
    <Modal>
      <div>Add new Fetch</div>
      <select
        onChange={(e) => setFetchType(e.target.value as FetchType["type"])}
      >
        <option value="filesystem">{"Local Files"}</option>
        <option value="archive.org">{"Internet Archive"}</option>
      </select>
      {fetchType === "archive.org" && <NewFetchArchive addFetch={addFetch} />}
      <button onClick={onClose}>Close</button>
    </Modal>
  )
}

type NewFetchTypeProps = {
  addFetch: (newFetch: FetchType) => void
}

export const NewFetchArchive = ({ addFetch }: NewFetchTypeProps) => {
  const [info, setInfo] = useState<Partial<FetchType>>({ type: "archive.org" })
  if (info.type !== "archive.org") throw new Error("Wrong type")

  const isValid = useMemo(() => {
    return (
      info.name !== undefined &&
      info.destination !== undefined &&
      info.extensions !== undefined
    )
  }, [info])

  return (
    <>
      <label>
        {"Archive name: https://archive.org/download/[this bit here]"}
        <input
          type="text"
          placeholder=""
          value={info.name}
          onChange={(e) => setInfo((i) => ({ ...i, name: e.target.value }))}
        />
      </label>

      {/* TODO filepicker */}

      {/* TODO some sort of list element */}

      {isValid && (
        <button onClick={() => addFetch(info as FetchType)}>Add</button>
      )}
    </>
  )
}
