import { useTranslation } from "react-i18next"
import { formatDownloadTime, InstalledCoreImage } from "../shared"
import { ReactNode, startTransition, Suspense } from "react"
import { useAtomValue, useSetAtom } from "jotai"
import { CoreInfoSelectorFamily } from "../../../jotai/selectors"
import { currentViewAtom } from "../../../jotai/view/atoms"
import Icon from "../../ui/Icon"

/**
 * What the update did: the updated and installed cores (each opens its
 * core page) and the downloaded files per core, in three columns.
 */
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
    <div className="update-modal__report">
      <h3 className="update-modal__report-title">
        <Icon icon="check" className="update-modal__report-check" />
        {t("finish_report.title", {
          time: formatDownloadTime(total_time / 1000 || 0),
        })}
      </h3>

      <div className="update-modal__report-columns">
        <ReportColumn
          title={t("finish_report.updated", { count: updated_cores.length })}
        >
          {updated_cores.map((c) => (
            <Suspense
              key={c}
              fallback={<div className="update-modal__report-core">{c}</div>}
            >
              <ReportCore coreName={c} />
            </Suspense>
          ))}
        </ReportColumn>

        <ReportColumn
          title={t("finish_report.installed", {
            count: installed_cores.length,
          })}
        >
          {installed_cores.map((c) => (
            <Suspense
              key={c}
              fallback={<div className="update-modal__report-core">{c}</div>}
            >
              <ReportCore coreName={c} />
            </Suspense>
          ))}
        </ReportColumn>

        <ReportColumn
          title={t("finish_report.downloaded_files", { count: fileCount })}
        >
          {Object.entries(downloaded_files_per_core).map(
            ([coreName, files]) => (
              <details key={coreName} className="update-modal__report-files">
                <summary>
                  {coreName}
                  <span className="update-modal__report-count">
                    {files.length}
                  </span>
                </summary>
                <ul>
                  {files.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </details>
            )
          )}
        </ReportColumn>
      </div>
    </div>
  )
}

const ReportColumn = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <section className="update-modal__report-column">
    <h4 className="update-modal__report-column-title">{title}</h4>
    <div className="update-modal__report-list">{children}</div>
  </section>
)

/** One core: its platform image, name and version; opens the core. */
const ReportCore = ({ coreName }: { coreName: string }) => {
  const coreInfo = useAtomValue(CoreInfoSelectorFamily(coreName))
  const setViewAndSubview = useSetAtom(currentViewAtom)

  return (
    <button
      type="button"
      className="update-modal__report-core"
      onClick={() =>
        startTransition(() =>
          setViewAndSubview({ view: "Cores", selected: coreName })
        )
      }
    >
      <InstalledCoreImage coreName={coreName} />
      <span className="update-modal__report-core-name">{coreName}</span>
      <span className="update-modal__report-core-version">
        {coreInfo.core.metadata.version}
      </span>
    </button>
  )
}
