import { Modal } from "../modal"
import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { FetchType } from "../../types"
import { open } from "@tauri-apps/plugin-dialog"
import { pocketPathAtom } from "../../jotai/atoms"
import { homeDirSelector } from "../../jotai/selectors"
import { useUpdateConfig } from "../settings/hooks/useUpdateConfig"
import { Trans, useTranslation } from "react-i18next"
import { ArchiveMetadataSelectorFamily } from "../../jotai/archive/selectors"
import { useAtomValue } from "jotai"
import Button from "../ui/Button"
import Callout from "../ui/Callout"
import Field from "../ui/Field"
import Icon from "../ui/Icon"
import Select from "../ui/Select"
import TextInput from "../ui/TextInput"

type NewFetchProps = {
  onClose: () => void
  /** Edits this source (at its place in the list) instead of adding one. */
  editing?: { fetch: FetchType; index: number }
}

type Draft = {
  type: FetchType["type"]
  /** Local Files: the folder on this computer. */
  path?: string
  /** Internet Archive: the item's identifier. */
  name?: string
  extensions: string[]
  destination?: string
}

/** A source's fields as a draft, to edit it. */
const draftFrom = (fetch: FetchType): Draft =>
  fetch.type === "archive.org"
    ? {
        type: "archive.org",
        name: fetch.name,
        extensions: fetch.extensions ?? [],
        destination: fetch.destination,
      }
    : {
        type: "filesystem",
        path: fetch.path,
        extensions: [],
        destination: fetch.destination,
      }

/**
 * Adds a fetch source: where the files come from (a folder on this computer
 * or an archive.org item) and where they go on the SD card. Every field says
 * what to enter, with an example. With `editing`, it changes that source.
 */
export const NewFetch = ({ onClose, editing }: NewFetchProps) => {
  const { t } = useTranslation("fetch")
  const updateConfig = useUpdateConfig()
  const [draft, setDraft] = useState<Draft>(() =>
    editing
      ? draftFrom(editing.fetch)
      : {
          type: "filesystem",
          extensions: [],
        }
  )
  const [archiveValid, setArchiveValid] = useState(false)

  const update = useCallback(
    (changes: Partial<Draft>) => setDraft((d) => ({ ...d, ...changes })),
    []
  )

  const newFetch = useMemo<FetchType | null>(() => {
    if (!draft.destination) return null
    if (draft.type === "filesystem") {
      if (!draft.path) return null
      return {
        type: "filesystem",
        path: draft.path,
        destination: draft.destination,
      }
    }
    if (!draft.name || !archiveValid) return null
    return {
      type: "archive.org",
      name: draft.name,
      destination: draft.destination,
      extensions: draft.extensions,
    }
  }, [archiveValid, draft])

  const addFetch = useCallback(async () => {
    if (!newFetch) return
    await updateConfig("fetches", (fetches) => {
      if (!editing) return [...(fetches || []), newFetch]
      const changed = [...(fetches || [])]
      changed.splice(editing.index, 1, newFetch)
      return changed
    })
    onClose()
  }, [newFetch, updateConfig, onClose, editing])

  return (
    <Modal
      className="modal--form"
      title={t(editing ? "new.edit_title" : "new.title")}
      onClose={onClose}
    >
      <p className="fetch__intro">{t("new.intro")}</p>

      <Field
        label={t("new.type_label")}
        htmlFor="fetch-type"
        hint={t(
          draft.type === "archive.org"
            ? "new.type_hint.archive_org"
            : "new.type_hint.filesystem"
        )}
      >
        <Select<FetchType["type"]>
          id="fetch-type"
          value={draft.type}
          onChange={(type) => update({ type })}
          options={[
            { value: "filesystem", label: t("types.filesystem") },
            { value: "archive.org", label: t("types.archive_org") },
          ]}
        />
      </Field>

      {draft.type === "filesystem" && (
        <Field
          label={t("new.origin_label")}
          htmlFor="fetch-origin"
          hint={t("new.origin_hint")}
        >
          <FolderPicker
            id="fetch-origin"
            value={draft.path}
            onChange={(path) => update({ path })}
          />
        </Field>
      )}

      {draft.type === "archive.org" && (
        <>
          <ArchiveNameField
            value={draft.name ?? ""}
            onChange={(name) => update({ name })}
            onValidChange={setArchiveValid}
          />
          <Field
            label={t("new.extensions_label")}
            htmlFor="fetch-extensions"
            hint={t("new.extensions_hint")}
          >
            <ListInput
              id="fetch-extensions"
              value={draft.extensions}
              onChange={(extensions) => update({ extensions })}
            />
          </Field>
          <Callout variant="info">{t("new.archive_tip")}</Callout>
        </>
      )}

      <Field
        label={t("new.destination_label")}
        htmlFor="fetch-destination"
        hint={
          <Trans
            t={t}
            i18nKey="new.destination_hint"
            components={{ code: <code /> }}
          />
        }
      >
        <FolderPicker
          id="fetch-destination"
          fileIsOnPocket
          value={draft.destination}
          onChange={(destination) => update({ destination })}
        />
      </Field>

      <div className="modal__actions">
        <Button theme="tertiary" onClick={onClose}>
          {t("new.cancel")}
        </Button>
        <Button theme="primary" disabled={!newFetch} onClick={addFetch}>
          {t(editing ? "new.save_changes" : "new.add_fetch")}
        </Button>
      </div>
    </Modal>
  )
}

type ArchiveNameFieldProps = {
  value: string
  onChange: (name: string) => void
  /** Whether the name was found on archive.org. */
  onValidChange: (valid: boolean) => void
}

/** The archive's name, checked against archive.org once typing pauses. */
const ArchiveNameField = ({
  value,
  onChange,
  onValidChange,
}: ArchiveNameFieldProps) => {
  const { t } = useTranslation("fetch")
  const [checkedName, setCheckedName] = useState("")

  // Only look the name up after a short pause, not on every key press
  useEffect(() => {
    onValidChange(false)
    const timeout = setTimeout(() => setCheckedName(value.trim()), 500)
    return () => clearTimeout(timeout)
  }, [value, onValidChange])

  const status =
    checkedName && checkedName === value.trim() ? (
      <Suspense
        fallback={t("new.validating_archive_name", { name: checkedName })}
      >
        <ArchiveCheck
          key={checkedName}
          name={checkedName}
          onValidChange={onValidChange}
        />
      </Suspense>
    ) : null

  return (
    <Field
      label={t("new.archive_label")}
      htmlFor="fetch-archive-name"
      hint={
        <>
          <Trans
            t={t}
            i18nKey="new.archive_hint"
            components={{ code: <code /> }}
          />
          {status && <span className="fetch__archive-status">{status}</span>}
        </>
      }
    >
      <TextInput
        id="fetch-archive-name"
        variant="code"
        value={value}
        onChange={onChange}
        placeholder="openFPGA-Files"
        autoCapitalize="off"
        autoComplete="off"
        spellCheck={false}
      />
    </Field>
  )
}

/** Looks the archive up; says whether it exists. */
const ArchiveCheck = ({
  name,
  onValidChange,
}: {
  name: string
  onValidChange: (valid: boolean) => void
}) => {
  const { t } = useTranslation("fetch")
  const metadata = useAtomValue(
    ArchiveMetadataSelectorFamily({ archiveName: name })
  )
  const valid = Boolean(metadata)

  useEffect(() => onValidChange(valid), [onValidChange, valid])

  if (!valid)
    return (
      <span className="fetch__archive-status--invalid">
        <Icon icon="warning-diamond" />
        {t("new.invalid_archive_name", { name })}
      </span>
    )
  return (
    <span className="fetch__archive-status--valid">
      <Icon icon="check" />
      {t("new.archive_found")}
    </span>
  )
}

type FolderPickerProps = {
  id?: string
  onChange: (path: string) => void
  value: string | undefined
  /** Picks a folder on the SD card, stored relative to it. */
  fileIsOnPocket?: boolean
}

/** The chosen folder in a code frame, and a button to choose it. */
const FolderPicker = ({
  id,
  value,
  fileIsOnPocket = false,
  onChange,
}: FolderPickerProps) => {
  const pocketPath = useAtomValue(pocketPathAtom)
  const homeDir = useAtomValue(homeDirSelector)
  const { t } = useTranslation("fetch")
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
    <div className="fetch__folder-picker">
      <TextInput
        id={id}
        className="fetch__folder-picker-value"
        variant="code"
        value={value?.replace(pocketPath, "") ?? ""}
        onChange={() => {}}
        placeholder={t("new.no_folder")}
        readOnly
        onClick={onClick}
      />
      <Button icon="folder" onClick={onClick}>
        {t("new.choose_folder")}
      </Button>
    </div>
  )
}

type ListInputProps = {
  id?: string
  value: string[]
  onChange: (newList: string[]) => void
}

/** File extensions as removable chips, with a field to add one. */
const ListInput = ({ id, value, onChange }: ListInputProps) => {
  const [interimValue, setInterimValue] = useState("")
  const { t } = useTranslation("fetch")

  const submitValue = useCallback(() => {
    const extension = interimValue.trim().replace(/^\./, "")
    if (extension.length === 0) return
    if (!value.includes(extension)) onChange([...value, extension])
    setInterimValue("")
  }, [interimValue, onChange, value])

  return (
    <div className="fetch__list-input">
      {value.length > 0 && (
        <ul className="fetch__extensions">
          {value.map((extension, index) => (
            <li key={extension} className="fetch__extension">
              {extension}
              <button
                type="button"
                className="fetch__extension-remove"
                aria-label={t("new.remove_extension", { extension })}
                onClick={() => {
                  const array = [...value]
                  array.splice(index, 1)
                  onChange(array)
                }}
              >
                <Icon icon="close" size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="fetch__list-input-add">
        <TextInput
          id={id}
          variant="code"
          value={interimValue}
          onChange={(text) => setInterimValue(text.toLowerCase())}
          placeholder={t("new.extension_placeholder")}
          autoCapitalize="off"
          autoComplete="off"
          spellCheck={false}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitValue()
          }}
        />
        <Button
          theme="tertiary"
          disabled={interimValue.trim().length === 0}
          onClick={submitValue}
        >
          {t("new.add_extension")}
        </Button>
      </div>
    </div>
  )
}
