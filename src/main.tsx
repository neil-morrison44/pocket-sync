import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "./app"
// import i18n from "./i18n"
import "./style.css"
import { installPolyfills } from "./polyfills"
import { I18nProvider } from "./i18n"
import { Disconnections } from "./components/disconnections"

import { error } from "@tauri-apps/plugin-log"
import { AutoUpdate } from "./components/autoUpdate"

installPolyfills()

// attachConsole()

window.addEventListener("error", (event) => {
  error(`${event.message}`)
})

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
      <Disconnections />
      <AutoUpdate />
    </I18nProvider>
  </React.StrictMode>
)
