import { Suspense, useMemo } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"
import { useRecoilSmoothUpdatesFirstSuspend } from "../../hooks/recoilSmoothUpdates"
import { GithubReleasesSelectorFamily } from "../../recoil/github/selectors"
import { AppVersionSelector } from "../../recoil/selectors"
import { ErrorBoundary } from "../errorBoundary"
import { Link } from "../link"
import { NewsFeed } from "../newsFeed"
import { Pocket } from "../three/pocket"
import { RandomScreenshotScreen } from "../three/randomScreenshotScreen"

import "./index.css"
import { updateAvailableSelector } from "../../recoil/firmware/selectors"
import { currentViewAtom } from "../../recoil/view/atoms"
import { StaticScreen } from "../three/staticScreen"
import { useTranslation } from "react-i18next"
import { semverCompare } from "../../utils/semverCompare"
import { ColourContextProvider } from "../three/colourContext"

export const About = () => {
  const selfReleases = useRecoilSmoothUpdatesFirstSuspend(
    GithubReleasesSelectorFamily({
      owner: "neil-morrison44",
      repo: "pocket-sync",
    })
  )

  const { t } = useTranslation("about")
  const AppVersion = useRecoilValue(AppVersionSelector)
  const firmwareUpdateAvailable = useRecoilValue(updateAvailableSelector)

  const updateAvailable = useMemo(() => {
    return semverCompare(selfReleases[0].tag_name, AppVersion)
  }, [selfReleases, AppVersion])

  const setCurrentView = useSetRecoilState(currentViewAtom)
  const version = `v${AppVersion}`

  return (
    <div className="about">
      <div className="about__top">
        <div>
          <h1>{t("app_name")}</h1>
          {version}
        </div>

        {firmwareUpdateAvailable && (
          <div
            className="about__update-link"
            onClick={() => setCurrentView({ view: "Firmware", selected: null })}
          >
            {t("new_firmware", {
              version: firmwareUpdateAvailable,
            })}
          </div>
        )}

        {updateAvailable && (
          <Link href={selfReleases[0].html_url} className="about__update-link">
            {t("update_available", { version: selfReleases[0].tag_name })}
          </Link>
        )}
        <ErrorBoundary>
          <ColourContextProvider body="trans_purple" buttons="glow">
            <Pocket
              move="back-and-forth"
              screenMaterial={
                <Suspense fallback={<StaticScreen />}>
                  <RandomScreenshotScreen />
                </Suspense>
              }
            />
          </ColourContextProvider>
        </ErrorBoundary>
      </div>

      <div className="about__news">
        <NewsFeed deepLinks />
      </div>
    </div>
  )
}
