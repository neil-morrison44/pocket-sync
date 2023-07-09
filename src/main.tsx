import React from "react"
import ReactDOM from "react-dom/client"
import { RecoilRoot } from "recoil"
import { App } from "./app"
import { I18nextProvider } from "react-i18next"
import i18n from "./i18n"
import "./style.css"
import { installPolyfills } from "./polyfills"

installPolyfills()

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RecoilRoot>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </RecoilRoot>
  </React.StrictMode>
)
