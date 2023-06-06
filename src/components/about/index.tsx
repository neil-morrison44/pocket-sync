import { Suspense, useMemo } from "react"
import { useRecoilCallback, useRecoilValue, useSetRecoilState } from "recoil"
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

export const About = () => {
  const selfReleases = useRecoilSmoothUpdatesFirstSuspend(
    GithubReleasesSelectorFamily({
      owner: "neil-morrison44",
      repo: "pocket-sync",
    })
  )

  const AppVersion = useRecoilValue(AppVersionSelector)
  const firmwareUpdateAvailable = useRecoilValue(updateAvailableSelector)

  const updateAvailable = useMemo(() => {
    return selfReleases[0].tag_name !== `v${AppVersion}`
  }, [selfReleases, AppVersion])

  const setCurrentView = useSetRecoilState(currentViewAtom)

  return (
    <div className="about">
      <div className="about__top">
        <div>
          <h1>Pocket Sync</h1>
          {`v${AppVersion}`}
        </div>

        {firmwareUpdateAvailable && (
          <div
            className="about__update-link"
            onClick={() => setCurrentView({ view: "Firmware", selected: null })}
          >{`New Pocket Firmware v${firmwareUpdateAvailable} available`}</div>
        )}

        {updateAvailable && (
          <Link
            href={selfReleases[0].html_url}
            className="about__update-link"
          >{`Update Available! ${selfReleases[0].tag_name}`}</Link>
        )}
        <ErrorBoundary>
          <Pocket
            move="back-and-forth"
            screenMaterial={
              <Suspense
                fallback={<meshPhongMaterial attach="material" color="green" />}
              >
                <RandomScreenshotScreen />
              </Suspense>
            }
          />
        </ErrorBoundary>
      </div>

      <div className="about__news">
        <NewsFeed deepLinks />
      </div>
    </div>
  )
}
