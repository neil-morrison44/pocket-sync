import React, { useState } from "react"
import ReactDOM from "react-dom/client"
import { App } from "./app"
// import i18n from "./i18n"
import "./theme.css"
import "./style.css"
import { installPolyfills } from "./polyfills"
import { I18nProvider } from "./i18n"
import { TooltipProvider } from "./components/ui/Tooltip"
import { useKeyboardFocus } from "./hooks/useKeyboardFocus"
import { useApplyTheme } from "./hooks/useApplyTheme"
import { platform } from "@tauri-apps/plugin-os"
import { Disconnections } from "./components/disconnections"
import { Link, Route, Switch } from "wouter"
import { error } from "@tauri-apps/plugin-log"
import {
  saveWindowState,
  restoreStateCurrent,
  StateFlags,
} from "@tauri-apps/plugin-window-state"
import { listen } from "@tauri-apps/api/event"
import { AutoUpdate } from "./components/autoUpdate"
import { createStore, getDefaultStore, Provider } from "jotai"
import { PluginWindow } from "./components/plugins/pluginWindow"
import { initGlobalFSEvents } from "./jotai/fileSystem/atoms"

installPolyfills()

restoreStateCurrent(StateFlags.ALL)

// attachConsole()

window.addEventListener("error", (event) => {
  error(`${event.message}`)
})

listen<string>("resize", (event) => {
  saveWindowState(StateFlags.ALL)
})

const jotaiStore = getDefaultStore()

initGlobalFSEvents()

// Applies the chosen theme; inside the Provider so it shares Settings' store
const ApplyTheme = () => {
  useApplyTheme()
  return null
}

const MainWindow = () => {
  return (
    <Provider store={jotaiStore}>
      <ApplyTheme />
      <App />
      <Disconnections />
      <AutoUpdate />
    </Provider>
  )
}

// Lets CSS adapt to the platform, e.g. the macOS overlay title bar
try {
  document.documentElement.classList.add(`platform-${platform()}`)
} catch {
  // not running in Tauri (e.g. a plain browser)
}

// Shows focus rings only while the keyboard is used
const KeyboardFocus = () => {
  useKeyboardFocus()
  return null
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <I18nProvider>
      <KeyboardFocus />
      <TooltipProvider>
        <Switch>
          <Route path="/" component={MainWindow} />

          <Route path="/plugin/:id">
            {(params) => <PluginWindow pluginId={params.id} />}
          </Route>

          {/* Default route in a switch */}
          <Route>404: No such page!</Route>
        </Switch>
      </TooltipProvider>
    </I18nProvider>
  </React.StrictMode>
)
