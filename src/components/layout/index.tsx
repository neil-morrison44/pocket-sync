import React, { Suspense, useState } from "react"
import { ContentView } from "../../types"
import { Loader } from "../loader"
import { Screenshots } from "../screenshots"
import "./index.css"

export const Layout = () => {
  const views: ContentView[] = [
    "Pocket Sync",
    "Games",
    "Cores",
    "Screenshots",
    "Saves",
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
        </Suspense>
      </div>
    </div>
  )
}
