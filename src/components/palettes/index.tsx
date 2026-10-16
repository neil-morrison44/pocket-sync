import {
  PaletteCodeKeptSelectorFamily,
  palettesListKeptSelector,
} from "../../jotai/palettes/selectors"
import {
  Dispatch,
  SetStateAction,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from "react"

import "./index.css"
import { Controls, ControlsActions } from "../controls"
import { ControlsButton } from "../controls/inputs/button"
import { PaletteFull } from "./paletteFull"
import { writeText } from "@tauri-apps/plugin-clipboard-manager"
import { Modal } from "../modal"
import { invokeSaveFile } from "../../utils/invokes"
import { pocketPathAtom } from "../../jotai/atoms"
import { PaletteName } from "./name"
import { useSavePalette } from "./hooks/useSavePalette"
import {
  paletteBaseName,
  paletteFolders,
  usePaletteActions,
} from "./hooks/usePaletteActions"
import { Palette, rgb } from "../../types"
import { useTranslation } from "react-i18next"
import { PreviewCanvas } from "./previewCanvas"
import { PaletteTown } from "./town"
import { useAtomValue } from "jotai"
import EmptyState from "../ui/EmptyState"
import IconButton from "../ui/IconButton"
import Button from "../ui/Button"
import Tile from "../ui/Tile"
import { Grid } from "../grid"
import { CardSkeleton } from "../ui/Skeleton"
import TextInput from "../ui/TextInput"
import Field from "../ui/Field"
import NoResults from "../ui/NoResults"
import Select from "../ui/Select"
import { ControlsSearch } from "../controls/inputs/search"
import { GroupHeader } from "../shared/groupHeader"

type PaletteUIModes =
  | { name: "list" }
  | { name: "new" }
  | { name: "selected"; palette: string }

export const Palettes = () => {
  const { t } = useTranslation("palettes")
  const [mode, setMode] = useState<PaletteUIModes>({ name: "list" })
  const [codeModalOpen, setCodeModalOpen] = useState(false)
  const [townOpen, setTownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [groupBy, setGroupBy] = useState<PaletteGrouping>("folder")
  const savePalette = useSavePalette()

  const createNewPalette = useCallback(async () => {
    const boringPalette = [
      [255, 255, 255],
      [128, 128, 128],
      [32, 32, 32],
      [0, 0, 0],
    ] as [rgb, rgb, rgb, rgb]
    const palette: Palette = {
      background: boringPalette,
      window: boringPalette,
      obj0: boringPalette,
      obj1: boringPalette,
      off: [255, 255, 255],
    }

    await savePalette(palette, "/a_new_palette.pal")
  }, [savePalette])

  // A palette's own page, with its header and actions
  if (mode.name === "selected") {
    return (
      <Suspense>
        <PaletteFull
          name={mode.palette}
          onClose={() => setMode({ name: "list" })}
          onRenamed={(palette) => setMode({ name: "selected", palette })}
        />
      </Suspense>
    )
  }

  return (
    <div className="palettes">
      <Controls>
        <Suspense>
          <PaletteListControls
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            groupBy={groupBy}
            onGroupByChange={setGroupBy}
          />
        </Suspense>
        <ControlsActions>
          {mode.name === "list" && (
            <>
              <ControlsButton onClick={() => setCodeModalOpen(true)}>
                {t("buttons.add_via_code")}
              </ControlsButton>
              <ControlsButton
                onClick={() => {
                  setTownOpen(true)
                }}
              >
                {t("buttons.palette_town")}
              </ControlsButton>
              <ControlsButton onClick={() => createNewPalette()}>
                {t("buttons.new")}
              </ControlsButton>
            </>
          )}
        </ControlsActions>
      </Controls>

      {townOpen && <PaletteTown onClose={() => setTownOpen(false)} />}

      {codeModalOpen && (
        <AddViaCodeModal onClose={() => setCodeModalOpen(false)} />
      )}

      {mode.name === "list" && (
        <PaletteList
          setMode={setMode}
          searchQuery={searchQuery}
          groupBy={groupBy}
        />
      )}
    </div>
  )
}

const PaletteListSkeleton = () => (
  <div className="grid" aria-hidden>
    {Array.from({ length: 6 }, (_, index) => (
      <CardSkeleton key={index} height={260} />
    ))}
  </div>
)

/** By the folder palettes sit in (Palette Town's are by author), or not. */
type PaletteGrouping = "folder" | "none"

/** A palette's folders as one label, e.g. "Author / Set"; "" at the top. */
const folderLabel = (name: string) => paletteFolders(name).join(" / ")

/**
 * Search, and the grouping when some palettes are in folders (otherwise
 * there's only one group, so it's left out).
 */
const PaletteListControls = ({
  searchQuery,
  onSearchChange,
  groupBy,
  onGroupByChange,
}: {
  searchQuery: string
  onSearchChange: (query: string) => void
  groupBy: PaletteGrouping
  onGroupByChange: (groupBy: PaletteGrouping) => void
}) => {
  const { t } = useTranslation("palettes")
  const palettesList = useAtomValue(palettesListKeptSelector)
  const hasFolders = (palettesList ?? []).some((name) => folderLabel(name))
  if (!palettesList || palettesList.length === 0) return null
  return (
    <>
      <ControlsSearch
        placeholder={t("controls.search")}
        value={searchQuery}
        onChange={onSearchChange}
      />
      {hasFolders && (
        <Select<PaletteGrouping>
          label={t("controls.group_by")}
          value={groupBy}
          onChange={onGroupByChange}
          options={[
            { value: "folder", label: t("controls.group.folder") },
            { value: "none", label: t("controls.group.none") },
          ]}
        />
      )}
    </>
  )
}

type PaletteListProps = {
  setMode: Dispatch<SetStateAction<PaletteUIModes>>
  searchQuery: string
  groupBy: PaletteGrouping
}

const PaletteList = ({ setMode, searchQuery, groupBy }: PaletteListProps) => {
  // Keeps the shown list while it reloads; skeletons only on the first load
  const palettesList = useAtomValue(palettesListKeptSelector)
  const { t } = useTranslation("palettes")

  const sortedPalettesList = useMemo(
    () => [...(palettesList ?? [])].sort((a, b) => a.localeCompare(b)),
    [palettesList]
  )

  // Search by name and folder
  const filteredPalettes = useMemo(() => {
    const search = searchQuery.toLowerCase().trim()
    if (!search) return sortedPalettesList
    return sortedPalettesList.filter((name) =>
      name
        .replace(/\.pal$/, "")
        .toLowerCase()
        .includes(search)
    )
  }, [sortedPalettesList, searchQuery])

  // Folders A–Z, palettes not in a folder first
  const groups = useMemo(() => {
    const byFolder = new Map<string, string[]>()
    for (const name of filteredPalettes) {
      const folder = groupBy === "folder" ? folderLabel(name) : ""
      byFolder.set(folder, [...(byFolder.get(folder) ?? []), name])
    }
    return [...byFolder].sort(([a], [b]) => a.localeCompare(b))
  }, [filteredPalettes, groupBy])

  const showHeaders =
    groupBy === "folder" && sortedPalettesList.some((name) => folderLabel(name))

  if (palettesList === undefined) return <PaletteListSkeleton />

  if (sortedPalettesList.length === 0) {
    return (
      <EmptyState icon="colors-swatch" title={t("empty.title")}>
        {t("empty.text")}
      </EmptyState>
    )
  }

  const renderGrid = (palettes: string[]) => (
    <Grid placeholderItemHeight={260}>
      {/* Each tile loads on its own, so a new palette doesn't put the whole
          list back into skeletons */}
      {palettes.map((palette) => (
        <Suspense key={palette} fallback={<CardSkeleton height={260} />}>
          <PaletteListItem
            name={palette}
            hideFolders={showHeaders}
            onClick={() => setMode({ name: "selected", palette })}
          />
        </Suspense>
      ))}
    </Grid>
  )

  return (
    <div className="search-results">
      {showHeaders
        ? groups.map(([folder, palettes]) => (
            <section className="palettes__group" key={folder}>
              <GroupHeader
                title={folder || t("groups.root")}
                count={t("count", { count: palettes.length })}
              />
              {renderGrid(palettes)}
            </section>
          ))
        : renderGrid(filteredPalettes)}
      <NoResults />
    </div>
  )
}

export const PaletteListItem = ({
  name,
  hideFolders = false,
  onClick,
}: {
  name: string
  /** In a folder's group, the folder is in its header already. */
  hideFolders?: boolean
  onClick: () => void
}) => {
  const paletteCode = useAtomValue(PaletteCodeKeptSelectorFamily(name))
  const [interimName, setInterimName] = useState(() => paletteBaseName(name))
  const { t } = useTranslation("palettes")
  const [renameMode, setRenameMode] = useState(false)

  const { duplicate, rename, remove } = usePaletteActions(name)

  const renamePalette = useCallback(async () => {
    setRenameMode(false)
    await rename(interimName)
  }, [interimName, rename])

  return (
    <Tile
      onClick={renameMode ? undefined : onClick}
      media={
        // Same shape as the preview, so the tile doesn't jump when it loads
        <Suspense fallback={<div className="palettes__preview-placeholder" />}>
          <PreviewCanvas name={name} />
        </Suspense>
      }
      title={
        renameMode ? (
          <div className="palettes__card-rename">
            <TextInput
              label={t("item.rename")}
              value={interimName}
              onChange={setInterimName}
              onKeyDown={({ key }) => {
                if (key === "Enter") renamePalette()
              }}
              autoFocus
            />
            <IconButton
              icon="check"
              label={t("item.rename")}
              onClick={renamePalette}
            />
          </div>
        ) : (
          <PaletteName name={name} hideFolders={hideFolders} />
        )
      }
      actions={
        <>
          <IconButton
            theme="tertiary"
            icon="copy"
            label={t("item.duplicate")}
            onClick={duplicate}
          />
          <IconButton
            theme="tertiary"
            icon="code"
            label={t("item.copy_code")}
            onClick={() => writeText(paletteCode)}
          />
          <IconButton
            theme="tertiary"
            icon="pencil"
            label={t("item.rename")}
            onClick={() => {
              setInterimName(paletteBaseName(name))
              setRenameMode(true)
            }}
          />
          <IconButton
            icon="trash"
            theme="destructive"
            label={t("item.delete")}
            onClick={remove}
            className="palettes__card-delete"
          />
        </>
      }
    />
  )
}

/**
 * Adds a palette from a share code (its colours as hex, then its name in
 * base64), like the ones "Copy Share Code" puts on the clipboard.
 */
const AddViaCodeModal = ({ onClose }: { onClose: () => void }) => {
  const [inputedCode, setInputedCode] = useState("")
  const pocketPath = useAtomValue(pocketPathAtom)
  const { t } = useTranslation("palettes")

  const parsedPalette = useMemo<{
    name: string
    data: Uint8Array
  } | null>(() => {
    const code = inputedCode.trim()
    if (code.length < 56 * 2) return null
    const data = new Uint8Array(56)
    for (let index = 0; index < 56 * 2; index += 2) {
      data[index / 2] = parseInt(`${code[index]}${code[index + 1]}`, 16)
    }

    if (
      data[51] !== 0x81 ||
      data[52] !== 0x41 ||
      data[53] !== 0x50 ||
      data[54] !== 0x47 ||
      data[55] !== 0x42
    )
      return null

    try {
      const name = atob(code.substring(56 * 2))
      return name ? { name, data } : null
    } catch {
      return null
    }
  }, [inputedCode])

  const onAdd = useCallback(async () => {
    if (!parsedPalette) return
    await invokeSaveFile(
      `${pocketPath}/Assets/gb/common/Palettes/${parsedPalette.name}`,
      parsedPalette.data
    )
    onClose()
  }, [onClose, parsedPalette, pocketPath])

  const isInvalid = inputedCode.trim().length > 0 && parsedPalette === null

  return (
    <Modal
      className="modal--form"
      title={t("add_via_code.title")}
      onClose={onClose}
    >
      <Field
        label={t("add_via_code.label")}
        htmlFor="palette-code"
        hint={
          parsedPalette
            ? t("add_via_code.found", { name: parsedPalette.name })
            : t("add_via_code.hint", { button: t("item.copy_code") })
        }
        error={isInvalid && t("add_via_code.invalid")}
      >
        <TextInput
          id="palette-code"
          variant="code"
          value={inputedCode}
          onChange={setInputedCode}
          onKeyDown={({ key }) => {
            if (key === "Enter") onAdd()
          }}
          autoFocus
          autoCapitalize="off"
          autoComplete="off"
          spellCheck={false}
        />
      </Field>
      <div className="modal__actions">
        <Button theme="tertiary" onClick={onClose}>
          {t("add_via_code.cancel")}
        </Button>
        <Button
          theme="primary"
          disabled={parsedPalette === null}
          onClick={onAdd}
        >
          {t("add_via_code.add")}
        </Button>
      </div>
    </Modal>
  )
}
