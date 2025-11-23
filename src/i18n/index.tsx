import i18n from "i18next"
import ICU from "i18next-icu"
import { initReactI18next } from "react-i18next"
import resources from "virtual:i18next-loader"
import { ReactNode, useMemo } from "react"
import { I18nextProvider } from "react-i18next"
import { alwaysUseEnglishAtom } from "../recoil/settings/atoms"
import { getLocale } from "tauri-plugin-locale-api"
import { useAtomValue } from "jotai"
import { info } from "@tauri-apps/plugin-log"

let userLanguage: string | null = null

type I18nProviderProps = {
  localeOverride?: string | null
  children: ReactNode
}

const getNiceLocale = async (): Promise<string> => {
  const rawLocale = await getLocale()
  info(`Locale is ${rawLocale}`)
  if (rawLocale.includes("@")) {
    const [locale, _otherBit] = rawLocale.split("@")
    return locale
  } else {
    return rawLocale
  }
}

export const I18nProvider = ({
  localeOverride,
  children,
}: I18nProviderProps) => {
  const alwaysUseEnglish = useAtomValue(alwaysUseEnglishAtom)

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
          (await getNiceLocale()),
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
