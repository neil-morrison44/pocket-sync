import React, {
  ReactNode,
  startTransition,
  Suspense,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react"
import { GithubReleasesSelectorFamily } from "../../jotai/github/selectors"
import { AppVersionSelector } from "../../jotai/selectors"
import { ErrorBoundary } from "../errorBoundary"
import { Link } from "../link"
import { NewsFeed } from "../newsFeed"

import "./index.css"
import { updateAvailableSelector } from "../../jotai/firmware/selectors"
import { currentViewAtom } from "../../jotai/view/atoms"

import { useTranslation } from "react-i18next"
import { semverCompare } from "../../utils/semverCompare"
import {
  ColourContextProviderFromConfig,
  ColourContextProviderRandomised,
} from "../three/colourContext"
import { ChangelogPanel } from "./changelog"
import Tabs from "../ui/Tabs"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { sponsorCountAtom } from "../../jotai/github/atoms"
import { AllPlatformImagesSelector } from "../../jotai/platforms/selectors"
import Icon from "../ui/Icon"
import Button from "../ui/Button"
import { Tip } from "../tip"
import type { Connection } from "../layout"
import IconButton from "../ui/IconButton"
import { atomWithStorage } from "jotai/utils"
import { open } from "@tauri-apps/plugin-shell"
import { useDisconnectPocket } from "../../hooks/useDisconnectPocket"

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

/** Whether the start screen's updates panel is shown; remembered locally. */
export const newsPanelOpenAtom = atomWithStorage(
  "pocket-sync:news-panel-open",
  true
)

export const About = ({ connection }: { connection: Connection }) => {
  const { t } = useTranslation("about")
  const { t: tApp } = useTranslation("app")
  const { connected } = connection
  const AppVersion = useAtomValue(AppVersionSelector)
  // Leaves the folder, but keeps its path so Reconnect still works
  const onEject = useDisconnectPocket()
  const [newsPanelOpen, setNewsPanelOpen] = useAtom(newsPanelOpenAtom)
  const version = `v${AppVersion}`

  return (
    <div className="about">
      {connected && (
        <Suspense>
          <PlatformImagePreload />
        </Suspense>
      )}
      <div className="about__main">
        <div className="about__toolbar">
          <IconButton
            theme="tertiary"
            icon="article"
            label={newsPanelOpen ? t("hide_updates") : t("show_updates")}
            aria-expanded={newsPanelOpen}
            onClick={() => setNewsPanelOpen((open) => !open)}
          />
        </div>
        <div className="about__top">
          <div className="about__title">
            <div className="about__sponsor">
              <Suspense>
                <SponsorLink />
              </Suspense>
            </div>
            <SillyTitleEffect>{t("app_name")}</SillyTitleEffect>
            {version}
          </div>
          {connected && (
            <Suspense>
              <FirmwareUpdateAvailable />
            </Suspense>
          )}

          <Suspense>
            <AppUpdateAvailable />
          </Suspense>

          {/* Fixed size, so the canvas only moves (never resizes) while the
              sidebar or the updates panel animate */}
          <div className="about__pocket">
            <Suspense fallback={<div className="three-pocket"></div>}>
              <ErrorBoundary>
                {connected ? (
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
                ) : (
                  <ColourContextProviderRandomised changeInterval={15000}>
                    <Pocket move="spin" />
                  </ColourContextProviderRandomised>
                )}
              </ErrorBoundary>
            </Suspense>
          </div>
        </div>
        <div className="about__eject">
          {connected ? (
            <Button theme="tertiary" icon="logout" onClick={onEject}>
              {t("eject")}
            </Button>
          ) : (
            <>
              {connection.attempts > 0 && <Tip>{tApp("not_pocket_tip")}</Tip>}
              <Button theme="primary" onClick={connection.onConnect}>
                {tApp("connect_button")}
              </Button>
            </>
          )}
        </div>
      </div>

      <aside
        className={`about__news ${newsPanelOpen ? "" : "about__news--closed"}`}
        inert={!newsPanelOpen}
      >
        <div className="about__news-inner">
          <Suspense
            fallback={<div className="news-feed news-feed--vertical"></div>}
          >
            <Tabs
              className="about__news-tabs"
              label={t("side_panel")}
              tabs={[
                {
                  value: "library",
                  label: t("library_updates"),
                  content: (
                    <NewsFeed deepLinks={connected} orientation="vertical" />
                  ),
                },
                {
                  value: "changelog",
                  label: t("whats_new"),
                  content: <ChangelogPanel />,
                },
              ]}
            />
          </Suspense>
        </div>
      </aside>
    </div>
  )
}

const FirmwareUpdateAvailable = () => {
  const { t } = useTranslation("about")
  const firmwareUpdateAvailable = useAtomValue(updateAvailableSelector)
  const setCurrentView = useSetAtom(currentViewAtom)

  if (!firmwareUpdateAvailable) return null

  return (
    <Button
      theme="primary"
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
    </Button>
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
    <Button
      theme="primary"
      className="about__update-link"
      onClick={() => open(selfReleases[0].html_url)}
    >
      {t("update_available", { version: selfReleases[0].tag_name })}
    </Button>
  )
}

const SponsorLink = () => {
  const sponsorCount = useAtomValue(sponsorCountAtom)
  const { t } = useTranslation("about")

  return (
    <Link href={"https://github.com/sponsors/neil-morrison44"}>
      <Icon icon="github" />
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

const PlatformImagePreload = () => {
  const _imageData = useAtomValue(AllPlatformImagesSelector)
  return null
}
