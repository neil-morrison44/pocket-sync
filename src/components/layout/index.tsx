import React, { Suspense, useState } from "react"
import { About } from "../about"
import { Cores } from "../cores"
import { Disconnections } from "../disconnections"
import { Games } from "../games"
import { Loader } from "../loader"
import { Platforms } from "../platforms"
import { Saves } from "../saves"
import { Screenshots } from "../screenshots"
import { Settings } from "../settings"
import { ZipInstall } from "../zipInstall"
import "./index.css"

export const Layout = () => {
  const views = [
    "Pocket Sync",
    "Games",
    "Cores",
    "Screenshots",
    "Saves",
    "Platforms",
    "Settings",
  ] as const
  const [viewName, setViewName] = useState<typeof views[number]>("Pocket Sync")

  return (
    <div className="layout">
      <Disconnections />
      <ZipInstall />
      <div className="layout__sidebar-menu">
        {views.map((v) => (
          <div
            className={`layout__sidebar-menu-item ${
              viewName === v ? "layout__sidebar-menu-item--active" : ""
            }`}
            key={v}
            onClick={() => setViewName(v)}
          >
            {v}
          </div>
        ))}
      </div>
      <div className="layout__content">
        <Suspense fallback={<Loader fullHeight />}>
          {viewName === "Screenshots" && <Screenshots />}
          {viewName === "Cores" && <Cores />}
          {viewName === "Pocket Sync" && <About />}
          {viewName === "Settings" && <Settings />}
          {viewName === "Games" && <Games />}
          {viewName === "Saves" && <Saves />}
          {viewName === "Platforms" && <Platforms />}
        </Suspense>
      </div>
    </div>
  )
}
