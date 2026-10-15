import { useAtom } from "jotai"
import { Controls, ControlsActions } from "../controls"
import { ControlsButton } from "../controls/inputs/button"
import Button from "../ui/Button"
import EmptyState from "../ui/EmptyState"
import Callout from "../ui/Callout"
import { pluginListSelector } from "../../jotai/plugins/selectors"
import { Modal } from "../modal"
import { useCallback, useMemo, useState } from "react"
import { WebviewWindow } from "@tauri-apps/api/webviewWindow"
import "./index.css"
import { useUpdateConfig } from "../settings/hooks/useUpdateConfig"
import { useAtomCallback } from "jotai/utils"
import { GithubReleasesSelectorFamily } from "../../jotai/github/selectors"
import { Link } from "../link"
import { PocketPluginInfo } from "../../types"
import { Trans, useTranslation } from "react-i18next"
import { invokeUninstallPlugin } from "../../utils/invokes"
import { ask } from "@tauri-apps/plugin-dialog"
import { ControlsSearch } from "../controls/inputs/search"
import {
  SearchContextProvider,
  SearchContextSelfHidingConsumer,
} from "../search/context"
import { Grid } from "../grid"
import Field from "../ui/Field"
import Icon from "../ui/Icon"
import IconButton from "../ui/IconButton"
import Select from "../ui/Select"
import TextInput from "../ui/TextInput"
import Tile from "../ui/Tile"
import NoResults from "../ui/NoResults"

export const Plugins = () => {
  const [addPluginModalOpen, setAddPluginModalOpen] = useState<boolean>(false)
  const { t } = useTranslation("plugins")
  const [plugins, refreshPlugins] = useAtom(pluginListSelector)
  const [searchQuery, setSearchQuery] = useState("")
  const [author, setAuthor] = useState("All")

  // The GitHub owners of the installed plugins; a filter only with several
  const authors = useMemo(
    () =>
      [...new Set(plugins.map(({ github_url }) => getOwner(github_url)))].sort(
        (a, b) => a.localeCompare(b)
      ),
    [plugins]
  )
  const searchFilters = useMemo(() => ({ author }), [author])

  return (
    <div className="plugins">
      {addPluginModalOpen && (
        <AddPluginModal onClose={() => setAddPluginModalOpen(false)} />
      )}
      <Controls>
        {plugins.length > 0 && (
          <ControlsSearch
            placeholder={t("controls.search")}
            value={searchQuery}
            onChange={setSearchQuery}
          />
        )}
        {authors.length > 1 && (
          <Select
            label={t("controls.author")}
            value={author}
            onChange={setAuthor}
            options={[
              { value: "All", label: t("controls.all") },
              ...authors.map((owner) => ({ value: owner })),
            ]}
          />
        )}
        <ControlsActions>
          <ControlsButton onClick={() => refreshPlugins()}>
            {t("buttons.refresh")}
          </ControlsButton>
          <ControlsButton onClick={() => setAddPluginModalOpen(true)}>
            {t("buttons.add")}
          </ControlsButton>
        </ControlsActions>
      </Controls>

      <Callout className="callout--in-page" dismissId="plugins-info">
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
      </Callout>

      {plugins.length === 0 && (
        <EmptyState
          icon="plug"
          title={t("empty.title")}
          action={
            <Button theme="primary" onClick={() => setAddPluginModalOpen(true)}>
              {t("buttons.add")}
            </Button>
          }
        >
          {t("empty.text")}
        </EmptyState>
      )}
      <SearchContextProvider query={searchQuery} other={searchFilters}>
        <div className="search-results">
          <Grid className="plugins__list" placeholderItemHeight={140}>
            {plugins.map((plugin) => (
              <PluginItem plugin={plugin} key={plugin.id} />
            ))}
          </Grid>
          {plugins.length > 0 && <NoResults />}
        </div>
      </SearchContextProvider>
    </div>
  )
}

/** The GitHub owner in a plugin's repository URL. */
const getOwner = (githubUrl: string) =>
  getGitHubInfo(githubUrl)?.owner ?? githubUrl

type PluginItemProps = {
  plugin: PocketPluginInfo
}

/**
 * An installed plugin: logo, name, repository, description and version.
 * Run opens it in its own window, where it asks its questions and works on
 * the SD card; the button shows that it's running until the window closes.
 */
const PluginItem = ({ plugin }: PluginItemProps) => {
  const { t } = useTranslation("plugins")
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const updateConfig = useUpdateConfig()
  const repository = plugin.github_url
    .replace(/^https?:\/\//, "")
    .replace(/^github\.com\//, "")

  const openPluginWindow = useCallback(async () => {
    setIsRunning(true)
    const webview = new WebviewWindow(`plugin-${plugin.id}`, {
      url: `/plugin/${plugin.id}`,
      title: `${plugin.name}`,
      width: 600,
      height: 900,
      resizable: true,
      alwaysOnTop: true,
      // The native title bar follows the app's theme
      theme:
        document.documentElement.dataset.theme === "light" ? "light" : "dark",
    })

    webview.once("tauri://destroyed", () => setIsRunning(false))
  }, [plugin.id, plugin.name])

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
  }, [plugin.github_url, plugin.id, t, updateConfig])

  return (
    <SearchContextSelfHidingConsumer
      fields={[plugin.name, plugin.description ?? "", plugin.github_url]}
      otherFn={({ author }) =>
        !author || author === "All" || getOwner(plugin.github_url) === author
      }
    >
      <Tile
        orientation="horizontal"
        className="plugins__item"
        media={
          plugin.logo_url ? (
            <img className="plugins__item-logo" src={plugin.logo_url} alt="" />
          ) : (
            <span className="tile__icon">
              <Icon icon="plug" size={24} />
            </span>
          )
        }
        title={plugin.name}
        subtitle={
          <Link className="plugins__item-link" href={plugin.github_url}>
            {repository}
          </Link>
        }
        description={plugin.description}
        meta={plugin.version}
        actions={
          <>
            <Button icon="play" disabled={isRunning} onClick={openPluginWindow}>
              {isRunning ? t("running") : t("buttons.run")}
            </Button>
            <IconButton
              theme="destructive"
              icon="trash"
              label={t("remove")}
              onClick={removePlugin}
            />
          </>
        }
      />
    </SearchContextSelfHidingConsumer>
  )
}

type AddPluginModalProps = {
  onClose: () => void
}

const AddPluginModal = ({ onClose }: AddPluginModalProps) => {
  const updateConfig = useUpdateConfig()
  const [urlText, setUrlText] = useState<string>("")
  const [urlIsInvalid, setUrlIsUnvalid] = useState<boolean>(false)
  const [checking, setChecking] = useState(false)
  const { t } = useTranslation("plugins")

  const addPlugin = useAtomCallback(
    useCallback(
      async (get) => {
        const info = getGitHubInfo(urlText.trim())
        if (!info) {
          setUrlIsUnvalid(true)
          return
        }
        setChecking(true)
        try {
          const { owner, repo } = info
          const releases = await get(
            GithubReleasesSelectorFamily({ owner, repo })
          )

          const assets = releases[0]?.assets.map(({ name }) => name) ?? []
          if (
            !assets.includes("plugin.wasm") ||
            !assets.includes("plugin.json")
          ) {
            setUrlIsUnvalid(true)
            return
          }

          updateConfig("plugins", (current) => [
            ...(current || []),
            urlText.trim(),
          ])
          onClose()
        } catch {
          setUrlIsUnvalid(true)
        } finally {
          setChecking(false)
        }
      },
      [urlText, updateConfig, onClose]
    )
  )

  return (
    <Modal
      className="modal--form"
      title={t("add_modal.title")}
      onClose={onClose}
    >
      <Field
        label={t("add_modal.url_label")}
        htmlFor="plugin-url"
        hint={t("add_modal.hint")}
        error={urlIsInvalid && t("add_modal.invalid")}
      >
        <TextInput
          id="plugin-url"
          variant="code"
          placeholder="https://github.com/owner/repository"
          value={urlText}
          onChange={(value) => {
            setUrlText(value)
            setUrlIsUnvalid(false)
          }}
          onKeyDown={({ key }) => {
            if (key === "Enter") addPlugin()
          }}
          autoFocus
          autoCapitalize="off"
          autoComplete="off"
          spellCheck={false}
        />
      </Field>
      <div className="modal__actions">
        <Button theme="tertiary" onClick={onClose}>
          {t("add_modal.cancel")}
        </Button>
        <Button
          theme="primary"
          disabled={urlText.trim().length === 0 || checking}
          onClick={addPlugin}
        >
          {checking ? t("add_modal.checking") : t("add_modal.add")}
        </Button>
      </div>
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
