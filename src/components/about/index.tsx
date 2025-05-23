import React, {
  ReactNode,
  startTransition,
  Suspense,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { GithubReleasesSelectorFamily } from "../../recoil/github/selectors"
import { AppVersionSelector } from "../../recoil/selectors"
import { ErrorBoundary } from "../errorBoundary"
import { Link } from "../link"
import { NewsFeed } from "../newsFeed"

import "./index.css"
import { updateAvailableSelector } from "../../recoil/firmware/selectors"
import { currentViewAtom } from "../../recoil/view/atoms"

import { useTranslation } from "react-i18next"
import { semverCompare } from "../../utils/semverCompare"
import { ColourContextProviderFromConfig } from "../three/colourContext"
import { Changelog } from "./changelog"
import { useAtomValue, useSetAtom } from "jotai"
import { sponsorCountAtom } from "../../recoil/github/atoms"

const Pocket = React.lazy(() =>
  import("../three/pocket").then((m) => ({ default: m.Pocket }))
)

const RandomScreenshotScreen = React.lazy(() =>
  import("../three/randomScreenshotScreen").then((m) => ({
    default: m.RandomScreenshotScreen,
  }))
)

const StaticScreen = React.lazy(() =>
  import("../three/staticScreen").then((m) => ({ default: m.StaticScreen }))
)

export const About = () => {
  const [changelogOpen, setChangelogOpen] = useState<boolean>(false)
  const { t } = useTranslation("about")
  const AppVersion = useAtomValue(AppVersionSelector)
  const version = `v${AppVersion}`

  return (
    <div className="about">
      {changelogOpen && (
        <Changelog
          onClose={() => startTransition(() => setChangelogOpen(false))}
        />
      )}
      <div className="about__sponsor">
        <Suspense>
          <div
            className="link"
            onClick={() => startTransition(() => setChangelogOpen(true))}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="currentColor"
            >
              <path d="M160-80v-440H80v-240h208q-5-9-6.5-19t-1.5-21q0-50 35-85t85-35q23 0 43 8.5t37 23.5q17-16 37-24t43-8q50 0 85 35t35 85q0 11-2 20.5t-6 19.5h208v240h-80v440H160Zm400-760q-17 0-28.5 11.5T520-800q0 17 11.5 28.5T560-760q17 0 28.5-11.5T600-800q0-17-11.5-28.5T560-840Zm-200 40q0 17 11.5 28.5T400-760q17 0 28.5-11.5T440-800q0-17-11.5-28.5T400-840q-17 0-28.5 11.5T360-800ZM160-680v80h280v-80H160Zm280 520v-360H240v360h200Zm80 0h200v-360H520v360Zm280-440v-80H520v80h280Z" />
            </svg>
            {t("whats_new")}
          </div>
          <SponsorLink />
        </Suspense>
      </div>
      <div className="about__top">
        <div className="about__title">
          <SillyTitleEffect>{t("app_name")}</SillyTitleEffect>
          {version}
        </div>
        <Suspense>
          <FirmwareUpdateAvailable />
        </Suspense>

        <Suspense>
          <AppUpdateAvailable />
        </Suspense>

        <Suspense fallback={<div className="three-pocket"></div>}>
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
        </Suspense>
      </div>

      <div className="about__news">
        <Suspense
          fallback={<div className="news-feed" style={{ flexGrow: 1 }}></div>}
        >
          <NewsFeed deepLinks />
        </Suspense>
      </div>
    </div>
  )
}

const FirmwareUpdateAvailable = () => {
  const { t } = useTranslation("about")
  const firmwareUpdateAvailable = useAtomValue(updateAvailableSelector)
  const setCurrentView = useSetAtom(currentViewAtom)

  if (!firmwareUpdateAvailable) return null

  return (
    <div
      className="about__update-link"
      onClick={() =>
        startTransition(() =>
          setCurrentView({ view: "Firmware", selected: null })
        )
      }
    >
      {t("new_firmware", {
        version: firmwareUpdateAvailable,
      })}
    </div>
  )
}

const AppUpdateAvailable = () => {
  const { t } = useTranslation("about")
  const selfReleases = useAtomValue(
    GithubReleasesSelectorFamily({
      owner: "neil-morrison44",
      repo: "pocket-sync",
    })
  )

  const AppVersion = useAtomValue(AppVersionSelector)

  const updateAvailable = useMemo(() => {
    return semverCompare(selfReleases[0].tag_name, AppVersion)
  }, [selfReleases, AppVersion])

  if (!updateAvailable) return null

  return (
    <Link href={selfReleases[0].html_url} className="about__update-link">
      {t("update_available", { version: selfReleases[0].tag_name })}
    </Link>
  )
}

const SponsorLink = () => {
  const sponsorCount = useAtomValue(sponsorCountAtom)
  const { t } = useTranslation("about")

  return (
    <Link href={"https://github.com/sponsors/neil-morrison44"}>
      <svg
        width="1.47em"
        height="1.44em"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 98 96"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
          fill="white"
        />
      </svg>
      {t("sponsor_link", { count: sponsorCount })}
    </Link>
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
