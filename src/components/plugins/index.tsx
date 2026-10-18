import { useAtom, useAtomValue } from "jotai"
import { Controls } from "../controls"
import { ControlsButton } from "../controls/inputs/button"
import { pluginListSelector } from "../../jotai/plugins/selectors"
import { Modal } from "../modal"
import { Suspense, useCallback, useMemo, useState } from "react"
import "./index.css"
import { useUpdateConfig } from "../settings/hooks/useUpdateConfig"
import { useAtomCallback } from "jotai/utils"
import { GithubReleasesSelectorFamily } from "../../jotai/github/selectors"
import { Link } from "../link"
import { PocketPluginInfo } from "../../types"
import { useBEM } from "../../hooks/useBEM"
import { Trans, useTranslation } from "react-i18next"
import { invokeUninstallPlugin } from "../../utils/invokes"
import { ask } from "@tauri-apps/plugin-dialog"
import { usePluginRunner } from "./hooks"
import { allUpdatersFilesSelector } from "../../jotai/cores/selectors"
import { PluginMiniItem } from "./miniItem"

export const Plugins = () => {
  const [addPluginModalOpen, setAddPluginModalOpen] = useState<boolean>(false)
  const { t } = useTranslation("plugins")
  const [plugins, refreshPlugins] = useAtom(pluginListSelector)

  return (
    <div className="plugins">
      {addPluginModalOpen && (
        <AddPluginModal onClose={() => setAddPluginModalOpen(false)} />
      )}
      <Controls>
        <ControlsButton onClick={() => setAddPluginModalOpen(true)}>
          {t("buttons.add")}
        </ControlsButton>
        <ControlsButton onClick={() => refreshPlugins()}>
          {t("buttons.refresh")}
        </ControlsButton>
      </Controls>

      <div className="plugins__list">
        {plugins.map((plugin) => (
          <PluginItem plugin={plugin} key={plugin.id} />
        ))}
      </div>

      <div className="plugins__info">
        <Suspense>
          <SuggestedPlugins />
        </Suspense>
        <Trans
          t={t}
          i18nKey="info"
          values={{ repo: "openfpga-library/pocket-plugin" }}
        >
          {"_"}
          <Link href="https://github.com/openfpga-library/pocket-plugin">
            {"_"}
          </Link>
        </Trans>
      </div>
    </div>
  )
}

const SuggestedPlugins = () => {
  const updatersFiles = useAtomValue(allUpdatersFilesSelector)
  const installedPlugins = useAtomValue(pluginListSelector)

  const coresWithUninstalledPlugins = useMemo(() => {
    return Object.entries(updatersFiles)
      .map(([key, { plugins }]) => {
        return [
          key,
          {
            plugins: (plugins ?? []).filter(
              (url) =>
                !installedPlugins.find(({ github_url }) => github_url === url)
            ),
          },
        ] as const
      })
      .filter(([_, { plugins }]) => (plugins ?? []).length > 0)
  }, [installedPlugins, updatersFiles])

  if (coresWithUninstalledPlugins.length === 0) return

  return (
    <div className="plugins__suggested-list">
      {coresWithUninstalledPlugins.map(([coreName, { plugins }]) => (
        <div className="plugins__suggested-list-item">
          <div>{coreName}</div>
          <div className="plugins__suggested-list-item-plugins">
            {(plugins ?? []).map((url) => (
              <PluginMiniItem key={url} url={url} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

type PluginItemProps = {
  plugin: PocketPluginInfo
}

const PluginItem = ({ plugin }: PluginItemProps) => {
  const { t } = useTranslation("plugins")
  const updateConfig = useUpdateConfig()
  const [isRunning, openPluginWindow] = usePluginRunner()

  const removePlugin = useCallback(async () => {
    const confirmation = await ask(t("confirm_remove"), {
      title: "Warning",
      kind: "warning",
    })

    if (!confirmation) return

    await invokeUninstallPlugin(plugin.id)
    updateConfig(
      "plugins",
      (p) => p?.filter((url) => url !== plugin.github_url) || []
    )
  }, [])

  const playButtonClass = useBEM({
    block: "plugins",
    element: "item-play",
    modifiers: { "is-running": isRunning },
  })

  return (
    <div className="plugins__item" key={plugin.id}>
      <img src={plugin.logo_url} className="plugins__item-logo" />
      <div className="plugins__item-name">{plugin.name}</div>
      <Link className="plugins__item-link" href={plugin.github_url}>
        {plugin.github_url}
      </Link>
      <p className="plugins__item-description">{plugin.description}</p>
      <div className="plugins__item-version">{plugin.version}</div>

      <div
        className={playButtonClass}
        onClick={() => openPluginWindow(plugin.id, plugin.name)}
      />
      <button className="plugins__item-remove" onClick={removePlugin}>
        {t("remove")}
      </button>
    </div>
  )
}

type AddPluginModalProps = {
  onClose: () => void
}

const AddPluginModal = ({ onClose }: AddPluginModalProps) => {
  const updateConfig = useUpdateConfig()
  const [urlText, setUrlText] = useState<string>("")
  const [urlIsInvalid, setUrlIsUnvalid] = useState<boolean>(false)
  const { t } = useTranslation("plugins")

  const addPlugin = useAtomCallback(
    useCallback(
      async (get) => {
        const info = getGitHubInfo(urlText)
        if (!info) {
          setUrlIsUnvalid(true)
          return
        }
        const { owner, repo } = info
        const releases = await get(
          GithubReleasesSelectorFamily({ owner, repo })
        )

        if (releases.length === 0) {
          setUrlIsUnvalid(true)
          return
        }

        const assets = releases[0].assets.map(({ name }) => name)
        if (
          !assets.includes("plugin.wasm") ||
          !assets.includes("plugin.json")
        ) {
          setUrlIsUnvalid(true)
          return
        }

        updateConfig("plugins", (current) => [...(current || []), urlText])
        onClose()
      },
      [urlText, setUrlIsUnvalid]
    )
  )

  return (
    <Modal className="modal--fit-content">
      <h2>{t("add_modal.title")}</h2>
      <input
        type="text"
        className="plugins__add-input"
        onChange={({ target }) => setUrlText(target.value)}
      />
      {urlIsInvalid && <div>{t("add_modal.invalid")}</div>}
      <button onClick={addPlugin}>{t("add_modal.add")}</button>
      <button onClick={onClose}>{t("add_modal.cancel")}</button>
    </Modal>
  )
}

const getGitHubInfo = (url: string) => {
  const regex =
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-z0-9-]+)\/([\w.-]+)\/?$/i
  const match = url.match(regex)

  if (match) {
    return {
      owner: match[1],
      repo: match[2],
    }
  }

  return null
}
