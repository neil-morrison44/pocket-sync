import Tile from "../../ui/Tile"
import Tag, { TagList } from "../../ui/Tag"
import { CardSkeleton } from "../../ui/Skeleton"
import { Modal, ModalSuspense } from "../../modal"
import {
  DownloadablePaletteColoursSelectorFamily,
  downloadablePalettesSelector,
  palettesListSelector,
} from "../../../jotai/palettes/selectors"
import { PreviewCanvasInner } from "../previewCanvas"
import { Grid } from "../../grid"

import "./index.css"
import { Suspense, useMemo } from "react"
import { Details } from "../../shared/details"
import { paletteRepoAtom } from "../../../jotai/palettes/atoms"
import { useSavePalette } from "../hooks/useSavePalette"
import { Link } from "../../link"
import { Trans, useTranslation } from "react-i18next"
import { useAtomValue } from "jotai"

type PaletteTownProps = {
  onClose: () => void
}

const PaletteTownContent = ({ onClose }: PaletteTownProps) => {
  const repo = useAtomValue(paletteRepoAtom)
  const palettes = useAtomValue(downloadablePalettesSelector)
  const palettesList = useAtomValue(palettesListSelector)
  const { t } = useTranslation("palettes")

  const undashedPalettesList = useMemo(
    () => palettesList.map((p) => undash(p)),
    [palettesList]
  )

  const repoUrl = useMemo(() => `https://github.com/${repo}`, [repo])

  const sortedPalettes = useMemo(() => {
    if (!palettes) return null
    return [...palettes]
      .map((pal) => ({
        ...pal,
        installed: undashedPalettesList.includes(undash(pal.path)),
      }))
      .sort((a, b) => a.path.localeCompare(b.path))
  }, [palettes, undashedPalettesList])

  const groupedPalettes = useMemo(() => {
    return sortedPalettes?.reduce(
      (acc, pal) => {
        const folderName = pal.path.split("/").at(0) as string
        acc[folderName] ||= []
        acc[folderName] = [...acc[folderName], pal]
        return acc
      },
      {} as Record<
        string,
        {
          name: string
          paletteData: Blob
          path: string
          installed: boolean
        }[]
      >
    )
  }, [sortedPalettes])

  return (
    <Modal className="palette-town" title={t("town.title")} onClose={onClose}>
      <p className="palette-town__intro">
        <Trans t={t} i18nKey="town.repo_link" values={{ repo }}>
          {"_"}
          <Link href={repoUrl}>{"_"}</Link>
        </Trans>{" "}
        {t("town.intro")}
      </p>
      <div className="palette-town__list">
        {groupedPalettes &&
          Object.entries(groupedPalettes).map(([folder, palettes]) => (
            <Details title={folder} key={folder} sticky>
              <Grid>
                <Suspense fallback={<CardSkeleton height={180} />}>
                  {palettes?.map(({ name, path, installed }) => (
                    <PaletteItem
                      key={path}
                      name={name}
                      path={path}
                      installed={installed}
                    />
                  ))}
                </Suspense>
              </Grid>
            </Details>
          ))}
      </div>
    </Modal>
  )
}

type PaletteItemProps = {
  name: string
  path: string
  installed: boolean
}

/** A palette as a tile; clicking adds it, unless it's on the card already. */
const PaletteItem = ({ name, path, installed }: PaletteItemProps) => {
  const paletteData = useAtomValue(
    DownloadablePaletteColoursSelectorFamily(path)
  )
  const savePalette = useSavePalette()
  const { t } = useTranslation("palettes")

  return (
    <Tile
      onClick={
        installed ? undefined : () => savePalette(paletteData, `/${path}`)
      }
      media={<PreviewCanvasInner palette={paletteData} />}
      title={name}
      tags={
        installed ? (
          <TagList>
            <Tag theme="accent" icon="check">
              {t("town.installed")}
            </Tag>
          </TagList>
        ) : undefined
      }
    />
  )
}

const undash = (path: string) => path.replaceAll("/", "").replaceAll("\\", "")

/** Opens right away with a loader while its data loads. */
export const PaletteTown = (props: PaletteTownProps) => {
  const { t } = useTranslation("palettes")
  return (
    <ModalSuspense
      className="palette-town"
      title={t("town.title")}
      onClose={props.onClose}
    >
      <PaletteTownContent {...props} />
    </ModalSuspense>
  )
}
