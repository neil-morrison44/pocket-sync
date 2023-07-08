import { useRecoilValue, useSetRecoilState } from "recoil"
import { Modal } from "../modal"
import { PocketSyncConfigSelector } from "../../recoil/config/selectors"
import { useCallback, useEffect, useMemo, useState } from "react"
import { FetchType } from "../../types"
import { open } from "@tauri-apps/api/dialog"
import { pocketPathAtom } from "../../recoil/atoms"
import { homeDirSelector } from "../../recoil/selectors"

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
      onClose()
    },
    [setConfig]
  )
  const [fetchType, setFetchType] = useState<FetchType["type"]>("filesystem")

  return (
    <Modal className="fetch__new">
      <div>Add new Fetch</div>
      <select
        className="fetch__type-select"
        onChange={(e) => setFetchType(e.target.value as FetchType["type"])}
      >
        <option value="filesystem">{"Local Files"}</option>
        <option value="archive.org">{"Internet Archive"}</option>
      </select>

      {fetchType === "filesystem" && <NewFetchFileSystem addFetch={addFetch} />}
      {fetchType === "archive.org" && <NewFetchArchive addFetch={addFetch} />}

      <button className="fetch__close-button" onClick={onClose}>
        Close
      </button>
    </Modal>
  )
}

type NewFetchTypeProps = {
  addFetch: (newFetch: FetchType) => void
}

export const NewFetchFileSystem = ({ addFetch }: NewFetchTypeProps) => {
  const [info, setInfo] = useState<Partial<FetchType>>({ type: "filesystem" })
  if (info.type !== "filesystem") throw new Error("Wrong type")

  const isValid = useMemo(() => {
    return info.destination !== undefined && info.path !== undefined
  }, [info])

  return (
    <>
      <FolderPicker
        text="Origin Folder"
        onChange={(path) => setInfo((i) => ({ ...i, path }))}
        value={info.path}
      />

      <FolderPicker
        fileIsOnPocket
        text="Destination Folder"
        onChange={(path) => setInfo((i) => ({ ...i, destination: path }))}
        value={info.destination}
      />

      {isValid && (
        <button onClick={() => addFetch(info as FetchType)}>Add</button>
      )}
    </>
  )
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
      <label className="fetch__text-input">
        {"Archive name: https://archive.org/download/[this bit here]"}
        <input
          type="text"
          placeholder=""
          value={info.name}
          onChange={(e) => setInfo((i) => ({ ...i, name: e.target.value }))}
        />
      </label>

      <FolderPicker
        fileIsOnPocket
        text="Destination Folder"
        onChange={(path) => setInfo((i) => ({ ...i, destination: path }))}
        value={info.destination}
      />
      <div className="fetch__text-input">
        {"File Extensions:"}
        <ListInput
          value={info.extensions || []}
          onChange={(ext) => setInfo((i) => ({ ...i, extensions: ext }))}
        />
      </div>
      {isValid && (
        <button onClick={() => addFetch(info as FetchType)}>Add</button>
      )}
    </>
  )
}

type FolderPickerProps = {
  text: string
  onChange: (path: string) => void
  value: string | undefined
  fileIsOnPocket?: boolean
}

const FolderPicker = ({
  text,
  value,
  fileIsOnPocket = false,
  onChange,
}: FolderPickerProps) => {
  const pocketPath = useRecoilValue(pocketPathAtom)
  const homeDir = useRecoilValue(homeDirSelector)
  if (!pocketPath) throw new Error("Missing PocketPath")

  const onClick = useCallback(async () => {
    const path = await open({
      multiple: false,
      directory: true,
      defaultPath: fileIsOnPocket ? pocketPath : homeDir,
    })

    console.log({path})

    if (path && !(path instanceof Array)) {
      onChange(fileIsOnPocket ? path.replace(pocketPath, "") : path)
    }
  }, [])

  return (
    <label className="fetch__folder-picker">
      <div className="fetch__folder-picker-value">
        {value?.replace(pocketPath, "")}
      </div>
      <button className="fetch__folder-button" onClick={onClick}>
        {text}
      </button>
    </label>
  )
}

type ListInputProps = {
  value: string[]
  onChange: (newList: string[]) => void
}

const ListInput = ({ value, onChange }: ListInputProps) => {
  const [interimValue, setInterimValue] = useState("")

  const submitValue = useCallback(() => {
    if (interimValue.length === 0) return
    if (value.includes(interimValue)) return
    onChange([...value, interimValue])
    setInterimValue("")
  }, [interimValue, onChange, setInterimValue])

  return (
    <div className="fetch__list-input">
      <ol className="fetch__list-input-list">
        {value.map((v, index) => (
          <li key={v} className="fetch__list-input-list-item">
            {v}
            <button
              onClick={() => {
                const array = [...value]
                array.splice(index)
                onChange(array)
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ol>
      <div className="fetch__list-input-add">
        <input
          type="text"
          onChange={(e) => setInterimValue(e.target.value.toLowerCase())}
          value={interimValue}
          autoCapitalize="off"
          autoComplete="off"
          spellCheck="false"
        />
        <button onClick={submitValue}>Add</button>
      </div>
    </div>
  )
}
