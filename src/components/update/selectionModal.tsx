import { ReactNode, Suspense, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useAtomValue } from "jotai"
import { fuzzy } from "fast-fuzzy"
import clsx from "clsx"

import { useRovingFocus } from "../../hooks/useRovingFocus"
import { installedCoresWithUpdatesSelector } from "../../jotai/cores/selectors"
import { InventoryItem } from "../../types"
import { CoreTags } from "../cores/tags"
import { Modal } from "../modal"
import Button from "../ui/Button"
import Icon from "../ui/Icon"
import SearchInput from "../ui/SearchInput"

import "./selectionModal.css"

type UpdateSelectionModalProps = {
  /**
   * The available cores to offer for installing: the Cores list's, already
   * narrowed by its search and filters (like the old Update page's filters).
   */
  available: InventoryItem[]
  /** Whether a search or filter on the Cores page narrowed `available`. */
  filtered: boolean
  /** Runs the bulk updater with the chosen cores. */
  onStart: (lists: { updateList: string[]; installList: string[] }) => void
  onClose: () => void
}

/**
 * What Update All will do, before it starts: the cores with an update
 * (all ticked), and available cores to install in the same run (searchable,
 * none ticked), each with its version, release date and tags. Brings back
 * picking several cores, like the old Update page.
 */
export const UpdateSelectionModal = ({
  available: availableItems,
  filtered,
  onStart,
  onClose,
}: UpdateSelectionModalProps) => {
  const { t } = useTranslation("cores")
  const updates = useAtomValue(installedCoresWithUpdatesSelector)

  const [toUpdate, setToUpdate] = useState<string[]>(() =>
    updates.map(({ coreName }) => coreName)
  )
  const [toInstall, setToInstall] = useState<string[]>([])
  const [query, setQuery] = useState("")

  const available = useMemo(
    () => [...availableItems].sort((a, b) => a.id.localeCompare(b.id)),
    [availableItems]
  )

  // Ticked ones stay visible while searching, so they can be unticked
  const visibleAvailable = useMemo(() => {
    const search = query.toLowerCase().trim()
    if (!search) return available
    return available.filter(
      ({ id }) =>
        toInstall.includes(id) || fuzzy(search, id.toLowerCase()) > 0.8
    )
  }, [available, query, toInstall])

  const toggle = (setter: typeof setToUpdate) => (id: string) =>
    setter((list) =>
      list.includes(id) ? list.filter((other) => other !== id) : [...list, id]
    )

  const nothingChosen = toUpdate.length + toInstall.length === 0

  return (
    <Modal
      className="update-selection"
      title={t("selection.title")}
      onClose={onClose}
    >
      {updates.length > 0 && (
        <section className="update-selection__section">
          <h3 className="update-selection__title">
            {t("updates", { count: updates.length })}
          </h3>
          <RovingList className="update-selection__list">
            {updates.map(({ coreName, installedVersion, latestVersion }) => (
              <CoreCheckRow
                key={coreName}
                coreName={coreName}
                detail={`${installedVersion} → ${latestVersion}`}
                checked={toUpdate.includes(coreName)}
                onToggle={() => toggle(setToUpdate)(coreName)}
              />
            ))}
          </RovingList>
        </section>
      )}

      <section className="update-selection__section update-selection__section--grow">
        <div className="update-selection__title-row">
          <h3 className="update-selection__title">
            {t("selection.install_title")}
          </h3>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={t("controls.search")}
          />
        </div>
        {filtered && (
          <p className="update-selection__note">{t("selection.filtered")}</p>
        )}
        <RovingList className="update-selection__list update-selection__list--scroll">
          {visibleAvailable.map(({ id, releases }) => (
            <CoreCheckRow
              key={id}
              coreName={id}
              detail={t("selection.release", {
                version: releases[0].core.metadata.version,
                date: new Date(releases[0].core.metadata.date_release),
              })}
              tags={<CoreTags coreName={id} installed={false} />}
              checked={toInstall.includes(id)}
              onToggle={() => toggle(setToInstall)(id)}
            />
          ))}
        </RovingList>
      </section>

      <div className="modal__actions">
        <Button theme="tertiary" onClick={onClose}>
          {t("selection.cancel")}
        </Button>
        <Button
          theme="primary"
          icon="upload"
          disabled={nothingChosen}
          onClick={() =>
            onStart({ updateList: toUpdate, installList: toInstall })
          }
        >
          {t("selection.start", {
            count: toUpdate.length + toInstall.length,
          })}
        </Button>
      </div>
    </Modal>
  )
}

/** A list of rows that's one tab stop; arrow keys move between rows. */
const RovingList = ({
  className,
  children,
}: {
  className: string
  children: ReactNode
}) => {
  const ref = useRef<HTMLUListElement>(null)
  const rovingFocus = useRovingFocus(ref, ".update-selection__row")
  return (
    <ul className={className} ref={ref} {...rovingFocus}>
      {children}
    </ul>
  )
}

/** One core to tick: a real checkbox button with its name, tags, detail. */
const CoreCheckRow = ({
  coreName,
  detail,
  tags,
  checked,
  onToggle,
}: {
  coreName: string
  /** E.g. the versions of an update, or a release's version and date. */
  detail?: string
  /** E.g. the license and AI-ness tags, like on the core's tile. */
  tags?: ReactNode
  checked: boolean
  onToggle: () => void
}) => (
  <li>
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      className={clsx(
        "update-selection__row",
        checked && "update-selection__row--checked"
      )}
      onClick={onToggle}
    >
      <Icon icon={checked ? "checkbox-on" : "circle"} />
      <span className="update-selection__name">{coreName}</span>
      {tags && (
        <Suspense>
          <span className="update-selection__tags">{tags}</span>
        </Suspense>
      )}
      {detail && <span className="update-selection__detail">{detail}</span>}
    </button>
  </li>
)
