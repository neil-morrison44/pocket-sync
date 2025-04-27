import { Modal } from "../../modal"
import {
  DownloadablePaletteColoursSelectorFamily,
  downloadablePalettesSelector,
  palettesListSelector,
} from "../../../recoil/palettes/selectors"
import { PreviewCanvasInner } from "../previewCanvas"
import { Grid } from "../../grid"

import "./index.css"
import { Suspense, useMemo } from "react"
import { Details } from "../../shared/details"
import { paletteRepoAtom } from "../../../recoil/palettes/atoms"
import { useSavePalette } from "../hooks/useSavePalette"
import { Loader } from "../../loader"
import { Link } from "../../link"
import { Trans, useTranslation } from "react-i18next"
import { useAtomValue } from "jotai"

type PaletteTownProps = {
  onClose: () => void
}

export const PaletteTown = ({ onClose }: PaletteTownProps) => {
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
    <Modal className="palette-town">
      <h2>{t("town.title")}</h2>
      <div className="palette-town--list">
        {groupedPalettes &&
          Object.entries(groupedPalettes).map(([folder, palettes]) => (
            <Details title={folder} key={folder} sticky>
              <Grid>
                <Suspense fallback={<Loader className="palette-town__item" />}>
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
      <div className="palette-town__repo-link">
        <Trans t={t} i18nKey="town.repo_link" values={{ repo }}>
          {"_"}
          <Link href={repoUrl}>{"_"}</Link>
        </Trans>
      </div>
      <button className="palette-town__close-button" onClick={onClose}>
        {t("town.close")}
      </button>
    </Modal>
  )
}

type PaletteItemProps = {
  name: string
  path: string
  installed: boolean
}

const PaletteItem = ({ name, path, installed }: PaletteItemProps) => {
  const paletteData = useAtomValue(
    DownloadablePaletteColoursSelectorFamily(path)
  )
  const savePalette = useSavePalette()

  return (
    <div
      className="palette-town__item"
      onClick={() => savePalette(paletteData, `/${path}`)}
    >
      <PreviewCanvasInner palette={paletteData} />
      <div
        className={`palette-town__item-name ${
          installed ? "palette-town__item-name--installed" : ""
        }`}
      >
        {name}
      </div>
    </div>
  )
}

const undash = (path: string) => path.replaceAll("/", "").replaceAll("\\", "")
