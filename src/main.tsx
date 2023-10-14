import React from "react"
import ReactDOM from "react-dom/client"
import { RecoilRoot } from "recoil"
import { App } from "./app"
// import i18n from "./i18n"
import "./style.css"
import { installPolyfills } from "./polyfills"
import { I18nProvider } from "./i18n"

installPolyfills()

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RecoilRoot>
      <I18nProvider>
        <App />
      </I18nProvider>
    </RecoilRoot>
  </React.StrictMode>
)
