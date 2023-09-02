import i18n from "i18next"
import ICU from "i18next-icu"
import { initReactI18next } from "react-i18next"
import { locale } from "@tauri-apps/api/os"
import resources from "virtual:i18next-loader"

let userLanguage: string | null = null

i18n
  .use(initReactI18next)
  .use(ICU)
  .use({
    type: "languageDetector",
    async: true,
    init: () => {
      return
    },
    detect: async () => "es" || (await locale()),
    cacheUserLanguage: (lng: string) => {
      userLanguage = lng
    },
  })
  .init({
    fallbackLng: "en",
    nonExplicitSupportedLngs: true,
    debug: true,
    interpolation: {
      escapeValue: false,
    },
    resources,
    i18nFormat: {
      parseLngForICU: (lng: string) => {
        // this makes ICU things like `{my_date, date, short}` actually respect the user's locale
        // even if `en` is the best fit locale
        return userLanguage ?? lng
      },
    },
  })

export default i18n
