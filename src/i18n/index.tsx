import i18n from "i18next"
import ICU from "i18next-icu"
import { initReactI18next } from "react-i18next"
import resources from "virtual:i18next-loader"
import { ReactNode, useMemo } from "react"
import { I18nextProvider } from "react-i18next"
import { useRecoilValue } from "recoil"
import { alwaysUseEnglishAtom } from "../recoil/settings/atoms"
import { locale } from "@tauri-apps/plugin-os"

let userLanguage: string | null = null

type I18nProviderProps = {
  localeOverride?: string | null
  children: ReactNode
}

export const I18nProvider = ({
  localeOverride,
  children,
}: I18nProviderProps) => {
  const alwaysUseEnglish = useRecoilValue(alwaysUseEnglishAtom)

  const i18nInstance = useMemo(() => {
    i18n
      .use(initReactI18next)
      .use(ICU)
      .use({
        type: "languageDetector",
        async: true,
        init: () => {
          return
        },
        detect: async () =>
          localeOverride ??
          (alwaysUseEnglish.value ? "en-US" : undefined) ??
          (await locale()),
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

    return i18n
  }, [localeOverride, alwaysUseEnglish])

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>
}
