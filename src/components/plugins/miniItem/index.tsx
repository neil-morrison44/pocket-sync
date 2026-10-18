import { useAtomValue } from "jotai"
import { useUpdateConfig } from "../../settings/hooks/useUpdateConfig"
import { usePluginRunner } from "../hooks"
import { pluginListSelector } from "../../../jotai/plugins/selectors"

import "./index.css"

export const PluginMiniItem = ({ url }: { url: string }) => {
  const pluginList = useAtomValue(pluginListSelector)
  const updateConfig = useUpdateConfig()
  const pluginInfo = pluginList.find(({ github_url }) => github_url === url)
  const [_isRunning, openPluginWindow] = usePluginRunner()

  if (!pluginInfo) {
    return (
      <div
        className="plugins-mini-item plugins-mini-item--install"
        onClick={() =>
          updateConfig("plugins", (current) => [...(current || []), url])
        }
      >
        <DownloadIcon />
        {url.replace("https://github.com/", "")}
      </div>
    )
  }

  return (
    <div
      className="plugins-mini-item plugins-mini-item--run"
      onClick={() => openPluginWindow(pluginInfo.id, pluginInfo.name)}
    >
      {pluginInfo.logo_url && (
        <img style={{ gridArea: "i" }} src={pluginInfo.logo_url} />
      )}

      <div style={{ gridArea: "n" }}>{pluginInfo.name}</div>
      <div style={{ gridArea: "v" }}>{pluginInfo.version}</div>
      <div className="plugins-mini-item__play" />
    </div>
  )
}

const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24px"
    viewBox="0 -960 960 960"
    width="24px"
    fill="#e3e3e3"
  >
    <path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" />
  </svg>
)
