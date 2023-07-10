import { Component, ErrorInfo, ReactNode } from "react"
import { Link } from "../link"
import { Tip } from "../tip"

import "./index.css"
import { ViewDebug } from "./viewDebug"
import { Trans } from "react-i18next"

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
      const shouldShowReportTip = !this.state.error?.message.includes(
        "GitHub rate limit reached"
      )

      return (
        <div className="error-boundary">
          <h1>
            <Trans i18nKey="error:title"></Trans>
          </h1>
          {shouldShowReportTip && (
            <Tip>
              <Link
                href={"https://github.com/neil-morrison44/pocket-sync/issues"}
              >
                <Trans i18nKey="error:report"></Trans>
              </Link>
            </Tip>
          )}
          <ViewDebug />

          <div className="error-boundary__message">
            {this.state.error?.message}
          </div>
          <div className="error-boundary__stack">{this.state.error?.stack}</div>

          <button style={{ width: "100%" }} onClick={() => this.clearError()}>
            <Trans i18nKey="error:retry"></Trans>
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
