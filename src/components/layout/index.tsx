import React, { Suspense, useState } from "react"
import { ContentView } from "../../types"
import { About } from "../about"
import { Cores } from "../cores"
import { Loader } from "../loader"
import { Screenshots } from "../screenshots"
import { Settings } from "../settings"
import "./index.css"

export const Layout = () => {
  const views: ContentView[] = [
    "Pocket Sync",
    "Games",
    "Cores",
    "Screenshots",
    "Saves",
    "Settings",
  ]
  const [viewName, setViewName] = useState<ContentView>("Pocket Sync")

  return (
    <div className="layout">
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
        </Suspense>
      </div>
    </div>
  )
}
