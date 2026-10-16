import Callout from "../ui/Callout"
import { Component, ErrorInfo, ReactNode, Suspense } from "react"
import { Link } from "../link"
import Button from "../ui/Button"

import "./index.css"
import { ViewDebug } from "./viewDebug"
import { Trans } from "react-i18next"
import { openLogDir } from "../../utils/openLogDir"
import { RepairButton } from "./repair"
import { NulledErrorBoundary } from "./nulledBoundary"

type ErrorBoundaryProps = {
  children?: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(err: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: err }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  clearError() {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      const shouldShowReportTip = !this.state?.error?.message?.includes(
        "GitHub rate limit reached"
      )

      return (
        <div className="error-boundary">
          <h1 className="error-boundary__title">
            <Trans i18nKey="error:title"></Trans>
          </h1>

          <p className="error-boundary__message">
            {typeof this.state.error === "string" && this.state.error}
            {this.state.error?.message}
          </p>

          {/* Shown when the error is one Pocket Sync can fix itself */}
          {this.state.error && (
            <NulledErrorBoundary>
              <Suspense>
                <RepairButton
                  error={this.state.error}
                  onFinishRepair={() => this.clearError()}
                />
              </Suspense>
            </NulledErrorBoundary>
          )}

          <div className="error-boundary__actions">
            <Button icon="folder" onClick={() => openLogDir()}>
              <Trans i18nKey="settings:logs.button"></Trans>
            </Button>
            <Button
              theme="primary"
              icon="reload"
              onClick={() => this.clearError()}
            >
              <Trans i18nKey="error:retry"></Trans>
            </Button>
          </div>

          {shouldShowReportTip && (
            <Callout>
              <Trans i18nKey="error:report"></Trans>{" "}
              <Link
                href={"https://github.com/neil-morrison44/pocket-sync/issues"}
              >
                <Trans i18nKey="error:report_link"></Trans>
              </Link>
            </Callout>
          )}

          <details className="error-boundary__details">
            <summary>
              <Trans i18nKey="error:details"></Trans>
            </summary>
            <ViewDebug />
            <pre className="error-boundary__stack">
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}
