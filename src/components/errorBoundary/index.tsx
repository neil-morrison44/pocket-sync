import React, { Component, ErrorInfo, ReactNode } from "react"
import { Link } from "../link"
import { Tip } from "../tip"

import "./index.css"

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

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Error</h1>
          <Tip>
            <Link
              href={"https://github.com/neil-morrison44/pocket-sync/issues"}
            >
              {
                "You can report this via GitHub include the text below & whatever you just did"
              }
            </Link>
          </Tip>
          <div className="error-boundary__message">
            {this.state.error?.message}
          </div>
          <div className="error-boundary__stack">{this.state.error?.stack}</div>
        </div>
      )
    }

    return this.props.children
  }
}
