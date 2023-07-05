import React, { Suspense, useCallback, useEffect, useRef } from "react"
import { useRecoilState } from "recoil"
import { currentViewAtom, VIEWS_LIST } from "../../recoil/view/atoms"
import { About } from "../about"
import { Cores } from "../cores"
import { Disconnections } from "../disconnections"
import { ErrorBoundary } from "../errorBoundary"
import { Games } from "../games"
import { Loader } from "../loader"
import { Platforms } from "../platforms"
import { Saves } from "../saves"
import { AutoBackup } from "../saves/autobackup"
import { SaveStates } from "../saveStates"
import { Screenshots } from "../screenshots"
import { Settings } from "../settings"
import { ZipInstall } from "../zipInstall"
import "./index.css"
import { Firmware } from "../firmware"
import { useTranslation } from "react-i18next"
import { Fetch } from "../fetch"

export const Layout = () => {
  const [viewAndSubview, setViewAndSubview] = useRecoilState(currentViewAtom)
  const { t } = useTranslation("layout")

  const changeView = useCallback(
    (viewName: (typeof VIEWS_LIST)[number]) => {
      setViewAndSubview({ view: viewName, selected: null })
      window.scrollTo({ top: 0 })
    },
    [setViewAndSubview]
  )

  const sidebarRef = useRef<HTMLDivElement>(null)
  const layoutRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sidebar = sidebarRef.current
    if (!sidebar) return

    const { width } = sidebar.getBoundingClientRect()

    const layout = layoutRef.current
    if (!layout) return

    layout.style.setProperty("--sidebar-width", `${width}px`)
  }, [])

  const { view } = viewAndSubview

  return (
    <div className="layout" ref={layoutRef}>
      <Disconnections />
      <ZipInstall />
      <Suspense>
        <AutoBackup />
      </Suspense>
      <div className="layout__sidebar-menu" ref={sidebarRef}>
        {VIEWS_LIST.map((v) => (
          <div
            className={`layout__sidebar-menu-item ${
              view === v ? "layout__sidebar-menu-item--active" : ""
            }`}
            key={v}
            onClick={() => changeView(v)}
          >
            {t(v.toLowerCase().replace(/\s/g, "_"))}
          </div>
        ))}
      </div>
      <div className="layout__content">
        <ErrorBoundary>
          <Suspense fallback={<Loader fullHeight />}>
            {view === "Screenshots" && <Screenshots />}
            {view === "Cores" && <Cores />}
            {view === "Pocket Sync" && <About />}
            {view === "Settings" && <Settings />}
            {view === "Games" && <Games />}
            {view === "Saves" && <Saves />}
            {view === "Save States" && <SaveStates />}
            {view === "Firmware" && <Firmware />}
            {view === "Platforms" && <Platforms />}
            {view === "Fetch" && <Fetch />}
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  )
}
