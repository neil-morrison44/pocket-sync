import React, { Suspense, useCallback, useEffect, useRef } from "react"
import { useRecoilState, useRecoilValue } from "recoil"
import { currentViewAtom, VIEWS_LIST } from "../../recoil/view/atoms"
import { About } from "../about"
import { ErrorBoundary } from "../errorBoundary"
import { Loader } from "../loader"
import { AutoBackup } from "../saves/autobackup"
import { ZipInstall } from "../zipInstall"
import "./index.css"
import { useTranslation } from "react-i18next"
import { enableGlobalZipInstallAtom } from "../../recoil/atoms"

const Saves = React.lazy(() =>
  import("../saves").then((i) => ({ default: i.Saves }))
)
const Cores = React.lazy(() =>
  import("../cores").then((i) => ({ default: i.Cores }))
)
const Palettes = React.lazy(() =>
  import("../palettes").then((i) => ({ default: i.Palettes }))
)
const Fetch = React.lazy(() =>
  import("../fetch").then((i) => ({ default: i.Fetch }))
)
const Screenshots = React.lazy(() =>
  import("../screenshots").then((i) => ({ default: i.Screenshots }))
)
const Settings = React.lazy(() =>
  import("../settings").then((i) => ({ default: i.Settings }))
)
const Games = React.lazy(() =>
  import("../games").then((i) => ({ default: i.Games }))
)
const SaveStates = React.lazy(() =>
  import("../saveStates").then((i) => ({ default: i.SaveStates }))
)
const Platforms = React.lazy(() =>
  import("../platforms").then((i) => ({ default: i.Platforms }))
)

const Firmware = React.lazy(() =>
  import("../firmware").then((i) => ({ default: i.Firmware }))
)

export const Layout = () => {
  const [viewAndSubview, setViewAndSubview] = useRecoilState(currentViewAtom)
  const enableGlobalZipInstall = useRecoilValue(enableGlobalZipInstallAtom)
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
      {enableGlobalZipInstall && <ZipInstall />}
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
            {view === "Palettes" && <Palettes />}
            {view === "Fetch" && <Fetch />}
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  )
}
