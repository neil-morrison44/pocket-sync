import { useTranslation } from "react-i18next"
import { formatDownloadTime, InstalledCoreImage } from "../shared"
import { Suspense } from "react"
import { AuthorTag } from "../../shared/authorTag"
import { useAtomValue } from "jotai"
import { CoreInfoSelectorFamily } from "../../../jotai/selectors"
import { OnlyLoadsWhenShown } from "../../../utils/onlyLoadsWhenShown"

export const UpdateFinishedReport = ({
  updated_cores,
  installed_cores,
  downloaded_files_per_core,
  total_time,
}: {
  updated_cores: string[]
  installed_cores: string[]
  downloaded_files_per_core: Record<string, string[]>
  total_time: number
}) => {
  const { t } = useTranslation("update")

  const fileCount = Object.values(downloaded_files_per_core).flatMap(
    (c) => c
  ).length

  return (
    <>
      <h3>
        {t("finish_report.title", {
          time: formatDownloadTime(total_time / 1000 || 0),
        })}
      </h3>

      <div className="update__core-finish-report-items">
        <div className="update__core-finish-report-item">
          <h3>{t("finish_report.updated", { count: updated_cores.length })}</h3>
          <div className="update__core-finish-report-cores">
            {updated_cores.map((c) => (
              <OnlyLoadsWhenShown height={52} className="">
                <Suspense key={c} fallback={<div>{c}</div>}>
                  <InstalledCoreItem coreName={c} />
                </Suspense>
              </OnlyLoadsWhenShown>
            ))}
          </div>
        </div>
        <div className="update__core-finish-report-item">
          <h3>
            {t("finish_report.installed", { count: installed_cores.length })}
          </h3>
          <div className="update__core-finish-report-cores">
            {installed_cores.map((c) => (
              <Suspense key={c} fallback={<div>{c}</div>}>
                <InstalledCoreItem coreName={c} />
              </Suspense>
            ))}
          </div>
        </div>

        <div className="update__core-finish-report-item">
          <h3>{t("finish_report.downloaded_files", { count: fileCount })}</h3>
          <div className="update__core-finish-report-cores">
            {Object.entries(downloaded_files_per_core).map(
              ([coreName, files]) => (
                <details>
                  <summary>{`${coreName} (${files.length})`}</summary>
                  <ul style={{ overflow: "auto", maxHeight: "200px" }}>
                    {files.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </details>
              )
            )}
          </div>
        </div>
      </div>
    </>
  )
}

const InstalledCoreItem = ({ coreName }: { coreName: string }) => {
  const coreInfo = useAtomValue(CoreInfoSelectorFamily(coreName))
  const [_, core] = coreName.split(".")

  return (
    <div className="update__core-finish-report-core">
      <InstalledCoreImage coreName={coreName} />
      <div>
        <div>{`${core} ${coreInfo.core.metadata.version}`}</div>
        <AuthorTag coreName={coreName} />
      </div>
    </div>
  )
}
