import { Suspense, useMemo } from "react"
import { useRecoilValue } from "recoil"
import { GithubReleasesSelectorFamily } from "../../recoil/github/selectors"
import {
  AppVersionSelector,
  PocketSyncConfigSelector,
} from "../../recoil/selectors"
import { ErrorBoundary } from "../errorBoundary"
import { Link } from "../link"
import { Pocket } from "../three/pocket"
import { ProgressScreen } from "../three/progressScreen"
import { RandomScreenshotScreen } from "../three/randomScreenshotScreen"

import "./index.css"

export const About = () => {
  const selfReleases = useRecoilValue(
    GithubReleasesSelectorFamily({
      owner: "neil-morrison44",
      repo: "pocket-sync",
    })
  )

  const AppVersion = useRecoilValue(AppVersionSelector)

  const updateAvailable = useMemo(() => {
    return selfReleases[0].tag_name !== `v${AppVersion}`
  }, [selfReleases, AppVersion])

  return (
    <div className="about">
      <div className="about__top">
        <div>
          <h1>Pocket Sync</h1>
          {`v${AppVersion}`}
        </div>

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

      <div className="about__info">
        <h3>Thanks to:</h3>

        <ul>
          <li>
            <Link
              href={
                "https://github.com/joshcampbell191/openfpga-cores-inventory"
              }
            >
              {"https://github.com/joshcampbell191/openfpga-cores-inventory"}
            </Link>
          </li>

          <li>
            <Link href={"https://github.com/AbFarid/analogue-os-font"}>
              {"https://github.com/AbFarid/analogue-os-font"}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
