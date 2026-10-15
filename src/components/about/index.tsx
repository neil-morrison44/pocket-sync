import React, {
  ReactNode,
  startTransition,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react"
import { GithubReleasesSelectorFamily } from "../../jotai/github/selectors"
import { AppVersionSelector } from "../../jotai/selectors"
import { ErrorBoundary } from "../errorBoundary"
import { Link } from "../link"
import { NewsFeed } from "../newsFeed"
import { newsFeedAtom, newsLastReadAtom } from "../../jotai/newsFeed/atoms"

import "./index.css"
import { updateAvailableSelector } from "../../jotai/firmware/selectors"
import { currentViewAtom } from "../../jotai/view/atoms"

import { useTranslation } from "react-i18next"
import { semverCompare } from "../../utils/semverCompare"
import { ColourContextProviderAuto } from "../three/colourContext"
import { ChangelogPanel } from "./changelog"
import Tabs from "../ui/Tabs"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { sponsorCountAtom } from "../../jotai/github/atoms"
import { AllPlatformImagesSelector } from "../../jotai/platforms/selectors"
import Icon from "../ui/Icon"
import Button from "../ui/Button"
import Popover from "../ui/Popover"
import Select from "../ui/Select"
import Skeleton from "../ui/Skeleton"
import Stats from "../ui/Stats"
import { PocketSyncConfigSelector } from "../../jotai/config/selectors"
import { currentFirmwareVersionSelector } from "../../jotai/firmware/selectors"
import { coresListSelector } from "../../jotai/selectors"
import { installedGamesCountSelector } from "../../jotai/games/selectors"
import { useUpdateConfig } from "../settings/hooks/useUpdateConfig"
import { useColourOptions } from "../settings/colourOptions"
import { PocketColour } from "../../types"
import { Tip } from "../tip"
import type { Connection } from "../layout"
import IconButton from "../ui/IconButton"
import { pocketPathAtom } from "../../jotai/atoms"
import { openFolder } from "../../utils/openFolder"
import { atomWithAppLocalSetting } from "../../utils/jotai"
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
export const newsPanelOpenAtom = atomWithAppLocalSetting(
  "ui_news_panel_open",
  true
)

export const About = ({ connection }: { connection: Connection }) => {
  const { t } = useTranslation("about")
  const { t: tApp } = useTranslation("app")
  const { t: tSettings } = useTranslation("settings")
  const { connected } = connection
  const AppVersion = useAtomValue(AppVersionSelector)
  // Leaves the folder, but keeps its path so Reconnect still works. Called
  // "Disconnect" like in Settings until the SD card can really be ejected
  const onDisconnect = useDisconnectPocket()
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
        <div className="about__toolbar" data-tauri-drag-region>
          <Suspense
            fallback={
              <NewsToggleButton
                open={newsPanelOpen}
                onToggle={() => setNewsPanelOpen(!newsPanelOpen)}
              />
            }
          >
            <NewsToggle
              open={newsPanelOpen}
              onToggle={() => setNewsPanelOpen(!newsPanelOpen)}
            />
          </Suspense>
        </div>
        <div className="about__top">
          <div className="about__title">
            <div className="about__sponsor">
              <Suspense>
                <SponsorLink />
              </Suspense>
            </div>
            <SillyTitleEffect>{t("app_name")}</SillyTitleEffect>
          </div>
          {connected && (
            <Suspense>
              <FirmwareUpdateAvailable />
            </Suspense>
          )}

          <Suspense>
            <AppUpdateAvailable />
          </Suspense>

          {/* Takes the height left after the title, banners, stats and
              buttons; the Pocket fits into it, so the page never scrolls.
              Its size follows the window height, not the width, so the
              canvas doesn't resize while the sidebar or panel animate. */}
          <div className="about__pocket-area">
            <div className="about__pocket">
              <Suspense fallback={<div className="three-pocket"></div>}>
                <ErrorBoundary>
                  <ColourContextProviderAuto
                    fromConfig={connected}
                    changeInterval={15000}
                  >
                    <Pocket
                      move={connected ? "back-and-forth" : "spin"}
                      screenMaterial={
                        connected ? (
                          <Suspense fallback={<StaticScreen />}>
                            <RandomScreenshotScreen />
                          </Suspense>
                        ) : undefined
                      }
                    />
                  </ColourContextProviderAuto>
                </ErrorBoundary>
              </Suspense>
            </div>
          </div>
        </div>
        {connected && (
          <Suspense fallback={<PocketStatsSkeleton />}>
            <PocketStats />
          </Suspense>
        )}
        <span className="about__version">{version}</span>
        <div className="about__actions">
          {connected ? (
            <>
              {/* Beside Eject, so it reads as a setting of the Pocket, not
                  of the app */}
              <Suspense>
                <PocketColoursPopover />
              </Suspense>
              <OpenSDCardButton />
              <Button theme="tertiary" icon="logout" onClick={onDisconnect}>
                {tSettings("disconnect.button")}
              </Button>
            </>
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

/** Opens the SD card (the connected folder) in Finder / Explorer. */
const OpenSDCardButton = () => {
  const pocketPath = useAtomValue(pocketPathAtom)
  const { t } = useTranslation("about")
  if (!pocketPath) return null
  return (
    <IconButton
      theme="tertiary"
      icon="folder"
      label={t("open_sd_card")}
      onClick={() => openFolder(pocketPath)}
    />
  )
}

type NewsToggleProps = {
  open: boolean
  onToggle: () => void
}

/**
 * Shows / hides the updates panel. A green dot marks library updates newer
 * than the last ones seen; opening the panel marks them as seen.
 */
const NewsToggle = ({ open, onToggle }: NewsToggleProps) => {
  const { items } = useAtomValue(newsFeedAtom)
  const [lastRead, setLastRead] = useAtom(newsLastReadAtom)

  const newest = useMemo(
    () => Math.max(0, ...items.map(({ published }) => published.getTime())),
    [items]
  )
  const unread = newest > lastRead

  useEffect(() => {
    if (open && unread) setLastRead(newest)
  }, [open, unread, newest, setLastRead])

  return <NewsToggleButton open={open} onToggle={onToggle} unread={unread} />
}

const NewsToggleButton = ({
  open,
  onToggle,
  unread = false,
}: NewsToggleProps & { unread?: boolean }) => {
  const { t } = useTranslation("about")
  const showDot = unread && !open
  return (
    <span className="about__news-toggle">
      <IconButton
        theme="tertiary"
        icon="article"
        label={
          open
            ? t("hide_updates")
            : showDot
              ? t("show_updates_new")
              : t("show_updates")
        }
        aria-expanded={open}
        onClick={onToggle}
      />
      {showDot && <span className="notification-dot" aria-hidden />}
    </span>
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

/** Quick colour settings for the 3D Pocket, saved like the ones in Settings. */
const PocketColoursPopover = () => {
  const { t } = useTranslation("about")
  const { t: tSettings } = useTranslation("settings")
  const config = useAtomValue(PocketSyncConfigSelector)
  const updateConfig = useUpdateConfig()
  const colourOptions = useColourOptions()

  return (
    <Popover
      title={t("pocket_colours")}
      trigger={
        // An icon button, so it doesn't compete with Disconnect
        <IconButton
          theme="tertiary"
          icon="colors-swatch"
          label={t("pocket_colours")}
        />
      }
    >
      <div className="about__colour-field">
        <label htmlFor="about-body-colour">{t("body_colour")}</label>
        <Select
          id="about-body-colour"
          value={config.colour}
          options={colourOptions}
          onChange={(value) => updateConfig("colour", value)}
        />
      </div>
      <div className="about__colour-field">
        <label htmlFor="about-button-colour">{t("button_colour")}</label>
        <Select<PocketColour | "match">
          id="about-button-colour"
          value={config.button_colour ?? "match"}
          options={[
            { value: "match", label: tSettings("3d_pocket.match_body") },
            ...colourOptions,
          ]}
          onChange={(value) =>
            updateConfig("button_colour", value === "match" ? undefined : value)
          }
        />
      </div>
    </Popover>
  )
}

/** Installed firmware, cores and games on the connected Pocket. */
const PocketStats = () => {
  const { t } = useTranslation("about")
  const firmware = useAtomValue(currentFirmwareVersionSelector)
  const cores = useAtomValue(coresListSelector)
  const games = useAtomValue(installedGamesCountSelector)

  return (
    <Stats
      className="about__stats"
      items={[
        { label: t("stats.firmware"), value: `v${firmware.version}` },
        { label: t("stats.cores"), value: cores.length },
        { label: t("stats.games"), value: games },
      ]}
    />
  )
}

const PocketStatsSkeleton = () => (
  <div className="about__stats about__stats--loading" aria-hidden>
    <Skeleton width="60px" height="2.4rem" />
    <Skeleton width="60px" height="2.4rem" />
    <Skeleton width="60px" height="2.4rem" />
  </div>
)
