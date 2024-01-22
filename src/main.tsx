import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "./app"
// import i18n from "./i18n"
import "./style.css"
import { installPolyfills } from "./polyfills"
import { I18nProvider } from "./i18n"
import { RecoilRoot } from "recoil"
import { Disconnections } from "./components/disconnections"

import { error, attachConsole } from "tauri-plugin-log-api"

installPolyfills()

attachConsole()

window.addEventListener("error", (event) => {
  error(`${event.message}`)
})

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RecoilRoot>
      <I18nProvider>
        <App />
        <Disconnections />
      </I18nProvider>
    </RecoilRoot>
  </React.StrictMode>
)
