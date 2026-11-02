import type { Preview } from "@storybook/react"
import { Suspense } from "react"
import { I18nProvider } from "../src/i18n"
import { tauriMockDecorator } from "./tauriMock"
import { Loader } from "../src/components/loader"

import "../src/style.css"
import "../src/font.css"
import "../src/app.css"

const preview: Preview = {
  // last-listed decorator renders outermost/first, so the Tauri mock must be
  // installed before I18nProvider reads an atomWithAppLocalStorage atom
  decorators: [
    (Story) => (
      <I18nProvider localeOverride="en-US">
        <Suspense fallback={<Loader />}>
          <Story />
        </Suspense>
      </I18nProvider>
    ),
    tauriMockDecorator,
  ],
}

export default preview
