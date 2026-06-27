import React, { useState } from "react"
import ReactDOM from "react-dom/client"
import { App } from "./app"
// import i18n from "./i18n"
import "./style.css"
import { installPolyfills } from "./polyfills"
import { I18nProvider } from "./i18n"
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
import { initGlobalFSEvents } from "./recoil/fileSystem/atoms"

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

const MainWindow = () => {
  return (
    <Provider store={jotaiStore}>
      <App />
      <Disconnections />
      <AutoUpdate />
    </Provider>
  )
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <I18nProvider>
      <Switch>
        <Route path="/" component={MainWindow} />

        <Route path="/plugin/:id">
          {(params) => <PluginWindow pluginId={params.id} />}
        </Route>

        {/* Default route in a switch */}
        <Route>404: No such page!</Route>
      </Switch>
    </I18nProvider>
  </React.StrictMode>
)
