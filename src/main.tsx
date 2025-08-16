import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "./app"
// import i18n from "./i18n"
import "./style.css"
import { installPolyfills } from "./polyfills"
import { I18nProvider } from "./i18n"
import { Disconnections } from "./components/disconnections"

import { error } from "@tauri-apps/plugin-log"
import {
  saveWindowState,
  restoreStateCurrent,
  StateFlags,
} from "@tauri-apps/plugin-window-state"
import { listen } from "@tauri-apps/api/event"
import { AutoUpdate } from "./components/autoUpdate"
import { createStore, Provider } from "jotai"

installPolyfills()

restoreStateCurrent(StateFlags.ALL)

// attachConsole()

window.addEventListener("error", (event) => {
  error(`${event.message}`)
})

listen<string>("resize", (event) => {
  saveWindowState(StateFlags.ALL)
})

const jotaiStore = createStore()

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <I18nProvider>
      <Provider store={jotaiStore}>
        <App />
        <Disconnections />
        <AutoUpdate />
      </Provider>
    </I18nProvider>
  </React.StrictMode>
)
