import React, { Suspense, useCallback, useTransition } from "react"

import { currentViewAtom, VIEWS_LIST } from "../../jotai/view/atoms"
import { About } from "../about"
import { ErrorBoundary } from "../errorBoundary"
import { Loader } from "../loader"
import { AutoBackup } from "../saves/autobackup"
import { ZipInstall } from "../zipInstall"
import * as RadixTabs from "@radix-ui/react-tabs"
import { SIDEBAR_TOGGLE_VALUE, Sidebar, sidebarCollapsedAtom } from "./sidebar"
import "./index.css"
import { enableGlobalZipInstallAtom } from "../../jotai/atoms"
import { useAtom, useAtomValue } from "jotai"

const Saves = React.lazy(() =>
  import("../saves").then((i) => ({ default: i.Saves }))
)
const Cores = React.lazy(() =>
  import("../cores").then((i) => ({ default: i.Cores }))
)

const Update = React.lazy(() =>
  import("../update").then((i) => ({ default: i.Update }))
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

const Plugins = React.lazy(() =>
  import("../plugins").then((i) => ({ default: i.Plugins }))
)

/** Whether an SD card / Pocket is connected, and how to connect one. */
export type Connection = {
  connected: boolean
  onConnect: () => void
  /** Failed connection attempts, to show a tip after the first one. */
  attempts: number
}

/**
 * The app shell: sidebar and current view. Without a connection only the
 * home view is available, so the app looks the same before and after
 * connecting.
 */
export const Layout = ({ connection }: { connection: Connection }) => {
  const [viewAndSubview, setViewAndSubview] = useAtom(currentViewAtom)
  const enableGlobalZipInstall = useAtomValue(enableGlobalZipInstallAtom)
  const [sidebarCollapsed, setSidebarCollapsed] = useAtom(sidebarCollapsedAtom)
  const [isPending, startTransition] = useTransition()

  const changeView = useCallback(
    (viewName: (typeof VIEWS_LIST)[number]) => {
      startTransition(() => {
        window.scrollTo({ top: 0 })
        setViewAndSubview({ view: viewName, selected: null })
      })
    },
    [setViewAndSubview]
  )

  const view = connection.connected ? viewAndSubview.view : "Pocket Sync"

  return (
    <RadixTabs.Root
      className={`layout ${sidebarCollapsed ? "layout--sidebar-collapsed" : ""}`}
      value={view as string}
      onValueChange={(value) => {
        if (value === SIDEBAR_TOGGLE_VALUE) {
          setSidebarCollapsed((collapsed) => !collapsed)
          return
        }
        changeView(value as (typeof VIEWS_LIST)[number])
      }}
      orientation="vertical"
      activationMode="manual"
    >
      {connection.connected && enableGlobalZipInstall && <ZipInstall />}
      {connection.connected && (
        <Suspense>
          <AutoBackup />
        </Suspense>
      )}
      {connection.connected && (
        <Sidebar
          view={view as (typeof VIEWS_LIST)[number]}
          isPending={isPending}
          connected={connection.connected}
        />
      )}
      {/* Not a tab stop itself; focus goes to the controls inside */}
      <RadixTabs.Content
        className="layout__content"
        value={view as string}
        tabIndex={-1}
      >
        <ErrorBoundary>
          <Suspense fallback={<Loader fullHeight />}>
            <div>
              {view === "Screenshots" && <Screenshots />}
              {view === "Cores" && <Cores />}
              {view === "Pocket Sync" && <About connection={connection} />}
              {view === "Settings" && <Settings />}
              {view === "Games" && <Games />}
              {view === "Update" && <Update />}
              {view === "Saves" && <Saves />}
              {view === "Save States" && <SaveStates />}
              {view === "Firmware" && <Firmware />}
              {view === "Platforms" && <Platforms />}
              {view === "Palettes" && <Palettes />}
              {view === "Fetch" && <Fetch />}
              {view === "Plugins" && <Plugins />}
            </div>
          </Suspense>
        </ErrorBoundary>
      </RadixTabs.Content>
    </RadixTabs.Root>
  )
}
