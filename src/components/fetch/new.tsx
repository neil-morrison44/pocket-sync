import { useRecoilValue } from "recoil"
import { Modal } from "../modal"
import { ReactNode, Suspense, useCallback, useMemo, useState } from "react"
import { FetchType } from "../../types"
import { open } from "@tauri-apps/plugin-dialog"
import { pocketPathAtom } from "../../recoil/atoms"
import { homeDirSelector } from "../../recoil/selectors"
import { useUpdateConfig } from "../settings/hooks/useUpdateConfig"
import { useTranslation } from "react-i18next"
import { Tip } from "../tip"
import { ArchiveMetadataSelectorFamily } from "../../recoil/archive/selectors"

type NewFetchProps = {
  onClose: () => void
}

export const NewFetch = ({ onClose }: NewFetchProps) => {
  const { t } = useTranslation("fetch")
  const updateConfig = useUpdateConfig()

  const addFetch = useCallback(
    async (newFetch: FetchType) => {
      await updateConfig("fetches", (fetches) => [...(fetches || []), newFetch])
      onClose()
    },
    [updateConfig, onClose]
  )
  const [fetchType, setFetchType] = useState<FetchType["type"]>("filesystem")

  return (
    <Modal className="fetch__new">
      <h2>{t("new.title")}</h2>
      <select
        className="fetch__type-select"
        onChange={(e) => setFetchType(e.target.value as FetchType["type"])}
      >
        <option value="filesystem">{t("types.filesystem")}</option>
        <option value="archive.org">{t("types.archive_org")}</option>
      </select>
      <div className="fetch__new-content">
        {fetchType === "filesystem" && (
          <NewFetchFileSystem addFetch={addFetch} />
        )}
        {fetchType === "archive.org" && <NewFetchArchive addFetch={addFetch} />}
      </div>

      <button className="fetch__close-button" onClick={onClose}>
        {t("new.close")}
      </button>
    </Modal>
  )
}

type NewFetchTypeProps = {
  addFetch: (newFetch: FetchType) => void
}

const NewFetchFileSystem = ({ addFetch }: NewFetchTypeProps) => {
  const [info, setInfo] = useState<Partial<FetchType>>({ type: "filesystem" })
  if (info.type !== "filesystem") throw new Error("Wrong type")

  const isValid = useMemo(() => {
    return info.destination !== undefined && info.path !== undefined
  }, [info])

  const { t } = useTranslation("fetch")

  return (
    <>
      <FolderPicker
        text={t("new.origin")}
        onChange={(path) => setInfo((i) => ({ ...i, path }))}
        value={info.path}
      />

      <FolderPicker
        fileIsOnPocket
        text={t("new.destination")}
        onChange={(path) => setInfo((i) => ({ ...i, destination: path }))}
        value={info.destination}
      />

      {isValid && (
        <button onClick={() => addFetch(info as FetchType)}>
          {t("new.add_fetch")}
        </button>
      )}
    </>
  )
}

const NewFetchArchive = ({ addFetch }: NewFetchTypeProps) => {
  const [info, setInfo] = useState<Partial<FetchType>>({
    type: "archive.org",
    extensions: [],
  })
  if (info.type !== "archive.org") throw new Error("Wrong type")
  const { t } = useTranslation("fetch")

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
        <span dangerouslySetInnerHTML={{ __html: t("new.archive_name") }} />
        <input
          type="text"
          placeholder=""
          value={info.name ?? ""}
          onChange={(e) => setInfo((i) => ({ ...i, name: e.target.value }))}
        />
      </label>

      <FolderPicker
        fileIsOnPocket
        text={t("new.destination")}
        onChange={(path) => setInfo((i) => ({ ...i, destination: path }))}
        value={info.destination}
      />
      <div className="fetch__text-input">
        {t("new.extensions")}
        <ListInput
          value={info.extensions || []}
          onChange={(ext) => setInfo((i) => ({ ...i, extensions: ext }))}
        />
      </div>

      <Tip>{t("new.archive_tip")}</Tip>

      {isValid && info.name && (
        <Suspense
          fallback={
            <div className="fetch__archive-check">
              {t("new.validating_archive_name", { name: info.name })}
            </div>
          }
        >
          <CheckArchiveValidity key={info.name} archiveName={info.name}>
            <button onClick={() => addFetch(info as FetchType)}>
              {t("new.add_fetch")}
            </button>
          </CheckArchiveValidity>
        </Suspense>
      )}
    </>
  )
}

const CheckArchiveValidity = ({
  archiveName,
  children,
}: {
  archiveName: string
  children: ReactNode
}) => {
  const { t } = useTranslation("fetch")
  const metadata = useRecoilValue(
    ArchiveMetadataSelectorFamily({ archiveName })
  )

  if (!metadata)
    return (
      <div className="fetch__archive-check">
        {t("new.invalid_archive_name", { name: archiveName })}
      </div>
    )
  return children
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

    if (path) {
      onChange(fileIsOnPocket ? path.replace(pocketPath, "") : path)
    }
  }, [fileIsOnPocket, homeDir, onChange, pocketPath])

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
  const { t } = useTranslation("fetch")

  const submitValue = useCallback(() => {
    if (interimValue.length === 0) return
    if (value.includes(interimValue)) return
    onChange([...value, interimValue])
    setInterimValue("")
  }, [interimValue, onChange, value])

  return (
    <div className="fetch__list-input">
      <ol className="fetch__list-input-list">
        {value.map((v, index) => (
          <li key={v} className="fetch__list-input-list-item">
            {v}
            <button
              onClick={() => {
                const array = [...value]
                array.splice(index, 1)
                onChange(array)
              }}
            >
              {"X"}
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
          onKeyDown={(e) => {
            if (e.code === "Enter") submitValue()
          }}
        />
        <button onClick={submitValue}>{t("new.add_extension")}</button>
      </div>
    </div>
  )
}
