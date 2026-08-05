import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
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
  }, [messageLog])

  return (
    <div className="plugins-window">
      <div
        className="plugins-window__log"
        onScroll={handleScroll}
        ref={logContainerRef}
      >
        {messageLog.map((text, index) => (
          <div key={index}>{text}</div>
        ))}
      </div>
      <div className="plugins-window__control">
        <PluginMessageRenderer
          message={currentPluginMessage}
          onAnswer={() => setCurrentPluginMessage(null)}
        />
      </div>
    </div>
  )
}

type PluginMessageRendererProps = {
  message: PluginMessage | null
  onAnswer: () => void
}

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
            <button
              key={c}
              onClick={() => {
                const message: HostMessage = { Answer: { name, value: c } }
                emit("plugin-host-message", message)
                onAnswer()
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </>
    )
  }

  if ("Text" in message) {
    const { name, query } = message.Text

    const submitText = () => {
      const outputMessage: HostMessage = {
        Answer: { name, value: inputString },
      }
      emit("plugin-host-message", outputMessage)
      onAnswer()
    }

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
