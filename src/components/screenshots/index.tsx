import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useRecoilState, useRecoilValue } from "recoil"
import { screenshotsListSelector } from "../../recoil/screenshots/selectors"
import { Screenshot } from "./item"

import "./index.css"
import { Loader } from "../loader"
import { ScreenshotInfo } from "./info"
import { Grid } from "../grid"
import { useSaveScroll } from "../../hooks/useSaveScroll"
import { Controls } from "../controls"
import { SearchContextProvider } from "../search/context"
import { selectedSubviewSelector } from "../../recoil/view/selectors"
import { useMultiExport } from "./hooks/useMultiExport"
import { invokeDeleteFiles } from "../../utils/invokes"
import { useTranslation } from "react-i18next"
import { ControlsSearch } from "../controls/inputs/search"
import { ControlsButton } from "../controls/inputs/button"
import { ControlsCheckbox } from "../controls/inputs/checkbox"

export const Screenshots = () => {
  const [selected, setSelected] = useRecoilState(selectedSubviewSelector)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectMode, setSelectMode] = useState(false)
  const [selectedScreenshots, setSelectedScreenshots] = useState<string[]>([])
  const { t } = useTranslation("screenshots")

  const screenshots = useRecoilValue(screenshotsListSelector)
  const exportMulti = useMultiExport()
  const { pushScroll, popScroll } = useSaveScroll()

  const deleteScreenshots = useCallback(async (screenshots: string[]) => {
    await invokeDeleteFiles(screenshots.map((s) => `Memories/Screenshots/${s}`))

    setSelectedScreenshots([])
  }, [])

  const sortedScreenshots = useMemo(() => {
    return [...screenshots].sort((a, b) => b.localeCompare(a))
  }, [screenshots])

  const changeSelectedImage = useCallback(
    (change: number) => {
      if (selected === null) return
      const selectedIndex = sortedScreenshots.findIndex((s) => s === selected)
      let newIndex = selectedIndex + change
      if (newIndex < 0) newIndex = sortedScreenshots.length - 1
      if (newIndex >= sortedScreenshots.length) newIndex = 0

      setSelected(sortedScreenshots[newIndex])
    },
    [setSelected, selected, sortedScreenshots]
  )

  useEffect(() => {
    const listener = ({ key }: KeyboardEvent) => {
      if (key === "ArrowLeft") {
        changeSelectedImage(-1)
      } else if (key === "ArrowRight") {
        changeSelectedImage(+1)
      }
    }
    document.addEventListener("keydown", listener)
    return () => document.removeEventListener("keydown", listener)
  }, [changeSelectedImage])

  if (selected) {
    return (
      <>
        <div
          className="screenshots__button screenshots__button--previous"
          onClick={() => changeSelectedImage(-1)}
        ></div>
        <div
          className="screenshots__button screenshots__button--next"
          onClick={() => changeSelectedImage(-1)}
        ></div>
        <ScreenshotInfo
          fileName={selected}
          onBack={() => {
            setSelected(null)
            popScroll()
          }}
        />
      </>
    )
  }

  if (sortedScreenshots.length === 0) {
    return (
      <div className="screenshots screenshots--none">
        <p>{t("no_screenshots")}</p>
      </div>
    )
  }

  return (
    <>
      <Controls>
        <ControlsSearch
          placeholder={t("controls.search")}
          value={searchQuery}
          onChange={setSearchQuery}
        />

        {selectMode && (
          <>
            <ControlsButton onClick={() => exportMulti(selectedScreenshots)}>
              {t("controls.export_selected", {
                count: selectedScreenshots.length,
              })}
            </ControlsButton>
            <ControlsButton
              onClick={() => deleteScreenshots(selectedScreenshots)}
            >
              {t("controls.delete_selected", {
                count: selectedScreenshots.length,
              })}
            </ControlsButton>
          </>
        )}
        <ControlsCheckbox
          checked={selectMode}
          onChange={(checked) => {
            setSelectedScreenshots([])
            setSelectMode(checked)
          }}
        >
          {t("controls.select")}
        </ControlsCheckbox>
      </Controls>
      <SearchContextProvider query={searchQuery}>
        <Grid className="screenshots">
          {sortedScreenshots.map((fileName) => (
            <Suspense
              fallback={<Loader className="screenshots__loading-item" />}
              key={fileName}
            >
              <Screenshot
                fileName={fileName}
                selected={selectMode && selectedScreenshots.includes(fileName)}
                onClick={() => {
                  if (selectMode) {
                    setSelectedScreenshots((s) => {
                      if (s.includes(fileName)) {
                        return s.filter((f) => f !== fileName)
                      } else {
                        return [...s, fileName]
                      }
                    })
                  } else {
                    pushScroll()
                    setSelected(fileName)
                  }
                }}
              />
            </Suspense>
          ))}
        </Grid>
      </SearchContextProvider>
    </>
  )
}
