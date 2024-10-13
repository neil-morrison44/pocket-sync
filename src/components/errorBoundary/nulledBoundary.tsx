import { Component, ErrorInfo, ReactNode } from "react"

type NulledErrorBoundaryProps = {
  children?: ReactNode
}

type NulledErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

export class NulledErrorBoundary extends Component<
  NulledErrorBoundaryProps,
  NulledErrorBoundaryState
> {
  public state: NulledErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(err: Error): NulledErrorBoundaryState {
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
    if (this.state.hasError) return null
    return this.props.children
  }
}
