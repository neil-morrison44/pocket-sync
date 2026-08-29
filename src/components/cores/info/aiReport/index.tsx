import { useAtomValue } from "jotai"
import { Fragment, useMemo } from "react"
import { aiCheckAtom } from "../../../../jotai/cores/atoms"
import { Trans, useTranslation } from "react-i18next"
import { Link } from "../../../link"

type AIReportProps = {
  coreName: string
}

export const AIReport = ({ coreName }: AIReportProps) => {
  const aiCheck = useAtomValue(aiCheckAtom)
  const { t } = useTranslation("core_info")
  const coreAIReport = useMemo(
    () => aiCheck[coreName] ?? null,
    [coreName, aiCheck]
  )

  if (!coreAIReport) return null

  return (
    <div>
      {Object.entries(coreAIReport.results).map(([check, result]) => {
        if (result.length === 0) return null
        return (
          <Fragment key={check}>
            <h3>{check}</h3>
            {result.map(({ name, score, output }) => {
              return (
                <>
                  <h4>
                    {name}
                    {" : "}
                    {t("ai_ness_score", {
                      score:
                        (score !== "GuaranteeHuman" && score.SuspectedAi) || 0,
                    })}
                  </h4>
                  {output.length > 0 && (
                    <ul>
                      {output.map((o) => (
                        <li>{o}</li>
                      ))}
                    </ul>
                  )}
                </>
              )
            })}
          </Fragment>
        )
      })}
      <div style={{ textAlign: "right" }}>
        <Trans t={t} i18nKey={"ai_report.info"}>
          {"_"}
          <Link href={"https://github.com/openfpga-library/openfpga-ai-check"}>
            {"_"}
          </Link>
        </Trans>
      </div>
    </div>
  )
}
