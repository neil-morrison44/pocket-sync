import React, { useEffect, useState } from "react"

import { writeText } from "@tauri-apps/plugin-clipboard-manager"
import clsx from "clsx"

import IconButton from "../IconButton"

import "./PathField.css"

export interface PathFieldProps {
  /** The path or URL to show. */
  value: string
  /** Label for the copy button, e.g. "Copy Path". */
  copyLabel: string
  /** Confirmation shown for a second after copying, e.g. "Copied". */
  copiedLabel: string
  /** Opens the path (e.g. in the file manager); adds an open button. */
  onOpen?: () => void
  /** Label for the open button, e.g. "Open Folder". */
  openLabel?: string
  className?: string
}

/**
 * A read-only path or URL in a slanted code frame, truncated at the start so
 * the end stays visible, with copy and optional open actions.
 */
const PathField = ({
  value,
  copyLabel,
  copiedLabel,
  onOpen,
  openLabel,
  className,
}: PathFieldProps) => {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setCopied(false), 1000)
    return () => clearTimeout(timeout)
  }, [copied])

  return (
    <div className={clsx("path-field", className)}>
      <span className="path-field__value" title={value}>
        <bdi>{value}</bdi>
      </span>
      <IconButton
        theme="tertiary"
        icon={copied ? "check" : "copy"}
        label={copied ? copiedLabel : copyLabel}
        tooltipOpen={copied}
        onClick={async () => {
          await writeText(value)
          setCopied(true)
        }}
      />
      {onOpen && openLabel && (
        <IconButton
          theme="tertiary"
          icon="folder"
          label={openLabel}
          onClick={onOpen}
        />
      )}
    </div>
  )
}

export default React.memo(PathField)
