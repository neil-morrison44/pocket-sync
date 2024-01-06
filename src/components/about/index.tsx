import { ReactNode, Suspense, useLayoutEffect, useMemo, useRef } from "react"
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
import { ColourContextProviderFromConfig } from "../three/colourContext"

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
        <div className="about__title">
          <SillyTitleEffect>{t("app_name")}</SillyTitleEffect>
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
          <ColourContextProviderFromConfig>
            <Pocket
              move="back-and-forth"
              screenMaterial={
                <Suspense fallback={<StaticScreen />}>
                  <RandomScreenshotScreen />
                </Suspense>
              }
            />
          </ColourContextProviderFromConfig>
        </ErrorBoundary>
      </div>

      <div className="about__news">
        <NewsFeed deepLinks />
      </div>
    </div>
  )
}

const SillyTitleEffect = ({ children }: { children: ReactNode }) => {
  const titleRef = useRef<HTMLHeadingElement>(null)
  useLayoutEffect(() => {
    const titleElement = titleRef.current
    if (!titleElement) return
    const onMouseMove = (event: MouseEvent) => {
      const titleRect = titleElement.getBoundingClientRect()
      const x = event.clientX - titleRect.x
      const y = event.clientY - titleRect.y

      const scaleX = (titleRect.width / 2 - x) / (titleRect.width / 2)
      const scaleY = (titleRect.height / 2 - y) / (titleRect.height / 2)

      titleElement.style.setProperty("--scale-x", scaleX.toFixed(3))
      titleElement.style.setProperty("--scale-y", scaleY.toFixed(3))
    }
    titleElement.addEventListener("mousemove", onMouseMove)

    return () => titleElement.removeEventListener("mousemove", onMouseMove)
  }, [])
  return <h1 ref={titleRef}>{children}</h1>
}
