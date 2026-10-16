import { Suspense, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { confirm } from "@tauri-apps/plugin-dialog"
import { search } from "fast-fuzzy"
import clsx from "clsx"

import { splitAsPath } from "../../../utils/splitAsPath"
import { gameDisplayName } from "../../../utils/gameName"
import { Controls, ControlsActions } from "../../controls"
import { ControlsBackButton } from "../../controls/inputs/backButton"
import { ControlsButton } from "../../controls/inputs/button"
import { ControlsSearch } from "../../controls/inputs/search"
import { Loader } from "../../loader"
import Button from "../../ui/Button"
import Callout from "../../ui/Callout"
import EmptyState from "../../ui/EmptyState"
import Select from "../../ui/Select"
import Tag from "../../ui/Tag"
import { PlatformLabel } from "../info/platformLabel"
import { SaveMapping } from "./mapping"
import { MISTER_SAVES_ROOT, useMisterSource } from "./source"

// The platform labels' styles live with Backups
import "../index.css"
import "./index.css"

type MisterSyncProps = {
  /** Leaves the session (and ends it). */
  onClose: () => void
}

/**
 * Step two of MiSTer Sync, once connected: the Pocket's saves on the left,
 * the chosen one compared with the MiSTer's on the right (with copying
 * either way), and the session's activity below.
 */
export const MisterSync = ({ onClose }: MisterSyncProps) => {
  const { t } = useTranslation("mister_sync")
  const source = useMisterSource()
  const [selectedSave, setSelectedSave] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [saveMappingOpen, setSaveMappingOpen] = useState(false)

  // Keeps the session open; ends it on leaving
  useEffect(() => {
    const interval = window.setInterval(source.heartbeat, 10 * 1000)
    return () => {
      clearInterval(interval)
      source.end()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mister-sync">
      <Controls>
        <ControlsBackButton onClick={onClose}>
          {t("controls.back")}
        </ControlsBackButton>
        <ControlsSearch
          placeholder={t("controls.search")}
          value={query}
          onChange={setQuery}
        />
        <ControlsActions>
          {/* The mapping reads the MiSTer's folders, which the demo hasn't */}
          {!source.demo && (
            <ControlsButton onClick={() => setSaveMappingOpen(true)}>
              {t("controls.save_mapping")}
            </ControlsButton>
          )}
        </ControlsActions>
      </Controls>

      {saveMappingOpen && (
        <Suspense>
          <SaveMapping onClose={() => setSaveMappingOpen(false)} />
        </Suspense>
      )}

      {source.demo && (
        <Callout className="callout--in-page">{t("demo_note")}</Callout>
      )}

      <div className="mister-sync__panes">
        <Suspense fallback={<Loader />}>
          <SavesList
            query={query}
            selected={selectedSave}
            onSelect={setSelectedSave}
          />
        </Suspense>

        <section className="mister-sync__detail" aria-live="polite">
          {selectedSave ? (
            <Suspense fallback={<Loader />}>
              <SaveCompare
                key={selectedSave}
                path={selectedSave}
                onOpenMapping={() => setSaveMappingOpen(true)}
              />
            </Suspense>
          ) : (
            <EmptyState icon="save" title={t("compare.pick_title")}>
              {t("compare.pick")}
            </EmptyState>
          )}
        </section>
      </div>

      <Activity />
    </div>
  )
}

type SavesListProps = {
  query: string
  selected: string | null
  onSelect: (save: string) => void
}

/** The Pocket's saves by platform; each one is a button to compare it. */
const SavesList = ({ query, selected, onSelect }: SavesListProps) => {
  const source = useMisterSource()
  const allSaves = source.useSaves()
  const { t } = useTranslation("mister_sync")

  const savesByPlatform = useMemo(() => {
    const saves = query.trim() ? search(query, allSaves) : allSaves
    const groups = new Map<string, string[]>()
    for (const save of saves) {
      const platform = splitAsPath(save).at(0) || "unknown"
      groups.set(platform, [...(groups.get(platform) ?? []), save])
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [allSaves, query])

  if (savesByPlatform.length === 0) {
    return (
      <nav className="mister-sync__list">
        <p className="mister-sync__list-empty">{t("list.empty")}</p>
      </nav>
    )
  }

  return (
    <nav className="mister-sync__list" aria-label={t("list.title")}>
      {savesByPlatform.map(([platformId, saves]) => (
        <section key={platformId} className="mister-sync__list-group">
          <Suspense
            fallback={
              <div className="saves__info-save-files-platform">
                {platformId}
              </div>
            }
          >
            <PlatformLabel id={platformId} />
          </Suspense>
          {saves.map((save) => (
            <button
              type="button"
              key={save}
              aria-pressed={save === selected}
              className={clsx(
                "mister-sync__list-item",
                save === selected && "mister-sync__list-item--selected"
              )}
              onClick={() => onSelect(save)}
            >
              {gameDisplayName(splitAsPath(save).at(-1) ?? save)}
            </button>
          ))}
        </section>
      ))}
    </nav>
  )
}

type SaveCompareProps = {
  path: string
  onOpenMapping: () => void
}

/**
 * One save on the Pocket next to the MiSTer's: when each was changed and
 * their checksums, which one is newer, and copying either way (asking
 * before one replaces the other).
 */
const SaveCompare = ({ path, onOpenMapping }: SaveCompareProps) => {
  const { t } = useTranslation("mister_sync")
  const source = useMisterSource()
  const [platform, file] = useMemo(() => {
    const split = splitAsPath(path)
    return [split.at(0), split.at(-1)]
  }, [path])

  const folders = source.useMisterFolders(platform)
  const misterSave = source.useMisterSave(folders, file)
  const pocketSave = source.usePocketSave(path)
  const [folder, setFolder] = useState(folders[0] ?? "")

  const found = Boolean(misterSave?.crc32)
  const misterPath =
    misterSave?.path ??
    (folders.length > 0 ? `${MISTER_SAVES_ROOT}${folder}/${file}` : null)

  const status: "same" | "pocket_newer" | "mister_newer" | "missing" = !found
    ? "missing"
    : misterSave?.crc32 === pocketSave.crc32
      ? "same"
      : (misterSave?.timestamp ?? 0) > pocketSave.timestamp
        ? "mister_newer"
        : "pocket_newer"

  const copyToMister = async () => {
    if (!misterPath) return
    if (found && !(await confirm(t("confirm.to_mister"), { kind: "warning" })))
      return
    source.copyToMister(path, misterPath)
  }

  const copyToPocket = async () => {
    if (!misterSave?.path) return
    if (!(await confirm(t("confirm.to_pocket"), { kind: "warning" }))) return
    source.copyToPocket(path, misterSave.path)
  }

  return (
    <div className="mister-sync__compare">
      <header className="mister-sync__compare-header">
        <h2 className="mister-sync__compare-title">
          {gameDisplayName(file ?? path)}
        </h2>
        {folders.length > 0 && (
          <Tag
            theme={
              status === "same"
                ? "accent"
                : status === "missing"
                  ? "neutral"
                  : "warning"
            }
            icon={status === "same" ? "check" : undefined}
          >
            {t(`compare.${status}`)}
          </Tag>
        )}
      </header>

      {folders.length === 0 ? (
        // The Pocket platform has no MiSTer folder in the mapping
        <Callout variant="warning">
          {t("unsupported", { platform })}
          {!source.demo && (
            <div className="mister-sync__callout-action">
              <Button onClick={onOpenMapping}>
                {t("controls.save_mapping")}
              </Button>
            </div>
          )}
        </Callout>
      ) : (
        <>
          <div className="mister-sync__sides">
            <SaveSide
              title={t("pocket")}
              path={`Saves/${path}`}
              timestamp={pocketSave.timestamp}
              crc32={pocketSave.crc32}
              newer={status === "pocket_newer"}
            />
            <SaveSide
              title={t("mister")}
              path={misterPath?.replace(MISTER_SAVES_ROOT, "") ?? ""}
              timestamp={misterSave?.timestamp}
              crc32={misterSave?.crc32}
              newer={status === "mister_newer"}
            >
              {/* Where to copy it to, when it could go into several */}
              {!found && folders.length > 1 && (
                <Select
                  label={t("folder")}
                  value={folder}
                  onChange={setFolder}
                  options={folders.map((f) => ({ value: f }))}
                />
              )}
            </SaveSide>
          </div>

          <div className="mister-sync__copy">
            <Button
              theme={status === "mister_newer" ? "primary" : "secondary"}
              icon="download"
              disabled={!found || status === "same"}
              onClick={copyToPocket}
            >
              {t("copy_to_pocket")}
            </Button>
            <Button
              theme={
                status === "pocket_newer" || status === "missing"
                  ? "primary"
                  : "secondary"
              }
              icon="upload"
              disabled={!misterPath || status === "same"}
              onClick={copyToMister}
            >
              {t("copy_to_mister")}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

type SaveSideProps = {
  title: string
  path: string
  timestamp?: number
  crc32?: number
  newer: boolean
  children?: React.ReactNode
}

/** One side of the comparison: changed when, checksum, where. */
const SaveSide = ({
  title,
  path,
  timestamp,
  crc32,
  newer,
  children,
}: SaveSideProps) => {
  const { t } = useTranslation("mister_sync")
  return (
    <div
      className={clsx("mister-sync__side", newer && "mister-sync__side--newer")}
    >
      <div className="mister-sync__side-title">
        {title}
        {newer && <Tag theme="accent">{t("newer")}</Tag>}
      </div>
      {crc32 ? (
        <dl className="mister-sync__facts">
          <dt>{t("modified")}</dt>
          <dd>{timestamp ? t("date", { date: new Date(timestamp) }) : "–"}</dd>
          <dt>{t("checksum")}</dt>
          <dd className="mister-sync__code">{crc32.toString(16)}</dd>
        </dl>
      ) : (
        <p className="mister-sync__not-found">{t("not_found")}</p>
      )}
      <div className="mister-sync__code mister-sync__path">{path}</div>
      {children}
    </div>
  )
}

/** The session's messages (connecting, copying, errors), folded. */
const Activity = () => {
  const { t } = useTranslation("mister_sync")
  const log = useMisterSource().useLog()
  return (
    <details className="mister-sync__activity">
      <summary>{t("activity", { count: log.length })}</summary>
      {log.length === 0 ? (
        <p className="mister-sync__list-empty">{t("activity_empty")}</p>
      ) : (
        <ol>
          {log.map((message, index) => (
            <li key={log.length - index}>{message}</li>
          ))}
        </ol>
      )}
    </details>
  )
}
