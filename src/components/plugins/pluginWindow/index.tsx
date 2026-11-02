import { useEffect, useRef, useState } from "react"
import { invokeKillPlugin, invokeRunPlugin } from "../../../utils/invokes"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { listen, emit } from "@tauri-apps/api/event"

import "./index.css"
import { ask } from "@tauri-apps/plugin-dialog"
import { useTranslation } from "react-i18next"

type PluginWindowProps = {
  pluginId: string
}

type PluginMessage =
  | { Choice: { name: string; query: string; choices: string[] } }
  | { Text: { name: string; query: string } }
  | "Exit"

type HostMessage = { Answer: { name: string; value: string } } | "Kill"

// The Tauri-facing wrapper: kicks off the plugin, listens for its log output
// and messages, and handles closing the window. It accumulates that state and
// feeds it down to <PluginWindowView>, which is pure presentation (and so can
// be previewed directly in Storybook without any Tauri).
export const PluginWindow = ({ pluginId }: PluginWindowProps) => {
  const [messageLog, setMessageLog] = useState<string[]>([""])
  const { t } = useTranslation("plugins")
  const [closeWindowOnExit, setCloseWindowOnExit] = useState<boolean>(false)
  const [currentPluginMessage, setCurrentPluginMessage] =
    useState<PluginMessage | null>(null)

  const invokedPluginRef = useRef<string | null>(null)

  useEffect(() => {
    let ignore = false
    const logsPromise = listen("plugin-log", (event) => {
      if (ignore) return
      const incomingText = event.payload as string

      setMessageLog((prevLogs) => {
        const currentLogs = prevLogs.length > 0 ? [...prevLogs] : [""]
        const parts = incomingText.split("\n")
        currentLogs[currentLogs.length - 1] += parts[0]
        if (parts.length > 1) {
          currentLogs.push(...parts.slice(1))
        }
        return currentLogs
      })
    })

    const messagesPromise = listen("plugin-plugin-message", (event) => {
      if (ignore) return
      setCurrentPluginMessage(event.payload as PluginMessage)
    })

    const runPlugin = async () => {
      await Promise.all([logsPromise, messagesPromise])
      if (invokedPluginRef.current !== pluginId && !ignore) {
        invokedPluginRef.current = pluginId
        console.log(`Triggering Rust backend for plugin: ${pluginId}`)
        await invokeRunPlugin(pluginId)
      }
    }

    runPlugin()

    return () => {
      ignore = true
      logsPromise.then((unlisten) => unlisten())
      messagesPromise.then((unlisten) => unlisten())
    }
  }, [pluginId])

  useEffect(() => {
    const appWindow = getCurrentWindow()
    if (currentPluginMessage === "Exit" && closeWindowOnExit) {
      appWindow.destroy()
      return
    }

    const unlistenPromise = appWindow.onCloseRequested(async (event) => {
      event.preventDefault()
      if (currentPluginMessage === null) {
        const confirmed = await ask(t("confirm_exit"), {
          title: "Warning",
          kind: "warning",
        })

        if (confirmed) {
          const message: HostMessage = "Kill"
          emit("plugin-host-message", message)
          // give the plugin a little chance to shut down gracefully
          await new Promise((resolve) => setTimeout(resolve, 250))
          // then just try to kill it
          await invokeKillPlugin(pluginId)
          await appWindow.destroy()
        }
      } else {
        const message: HostMessage = "Kill"
        emit("plugin-host-message", message)
        setCloseWindowOnExit(true)
      }
    })

    return () => {
      unlistenPromise.then((unlisten) => unlisten())
    }
  }, [closeWindowOnExit, currentPluginMessage])

  // Report the user's answer back to the plugin over Tauri, then clear the
  // prompt so the log is shown again.
  const onAnswer = (name: string, value: string) => {
    const message: HostMessage = { Answer: { name, value } }
    emit("plugin-host-message", message)
    setCurrentPluginMessage(null)
  }

  return (
    <PluginWindowView
      logs={messageLog}
      message={currentPluginMessage}
      onAnswer={onAnswer}
    />
  )
}

type PluginWindowViewProps = {
  logs: string[]
  message: PluginMessage | null
  onAnswer: (name: string, value: string) => void
}

// Pure presentation: renders the accumulated log and whatever the plugin is
// currently asking. It owns no Tauri and no app state — everything arrives via
// props — so it can be rendered in Storybook in any of its states directly.
export const PluginWindowView = ({
  logs,
  message,
  onAnswer,
}: PluginWindowViewProps) => {
  const logContainerRef = useRef<HTMLDivElement>(null)
  const isScrolledToBottomRef = useRef<boolean>(true)

  const handleScroll = () => {
    const terminal = logContainerRef.current
    if (!terminal) return
    const { scrollHeight, scrollTop, clientHeight } = terminal
    isScrolledToBottomRef.current =
      scrollHeight - scrollTop <= clientHeight + 10
  }

  useEffect(() => {
    const terminal = logContainerRef.current
    if (!terminal) return
    if (isScrolledToBottomRef.current) {
      terminal.scrollTop = terminal.scrollHeight
    }
  }, [logs])

  return (
    <div className="plugins-window">
      <div
        className="plugins-window__log"
        onScroll={handleScroll}
        ref={logContainerRef}
      >
        {logs.map((text, index) => (
          <div key={index}>{text}</div>
        ))}
      </div>
      <div className="plugins-window__control">
        <PluginMessageRenderer message={message} onAnswer={onAnswer} />
      </div>
    </div>
  )
}

type PluginMessageRendererProps = {
  message: PluginMessage | null
  onAnswer: (name: string, value: string) => void
}

// Renders a single plugin message (a choice prompt, a text prompt, or the
// "safe to close" notice). Presentational: it reports the user's answer to
// `onAnswer` and lets the parent decide what to do with it.
const PluginMessageRenderer = ({
  message,
  onAnswer,
}: PluginMessageRendererProps) => {
  const { t } = useTranslation("plugins")
  const [inputString, setInputString] = useState<string>("")

  if (!message) return null

  if (message === "Exit") {
    return <div>{t("safe_to_close")}</div>
  }

  if ("Choice" in message) {
    const { name, query, choices } = message.Choice
    return (
      <>
        <div className="plugins-window__query">{query}</div>
        <div className="plugins-window__buttons">
          {choices.map((c) => (
            <button key={c} onClick={() => onAnswer(name, c)}>
              {c}
            </button>
          ))}
        </div>
      </>
    )
  }

  if ("Text" in message) {
    const { name, query } = message.Text

    const submitText = () => onAnswer(name, inputString)

    return (
      <>
        <div className="plugins-window__query">{query}</div>
        <input
          className="plugins-window__text-input"
          onChange={({ target }) => setInputString(target.value)}
          autoFocus
          onKeyDown={({ key }) => {
            if (key === "Enter") submitText()
          }}
        />
        <button onClick={submitText}>{t("submit")}</button>
      </>
    )
  }

  return null
}
