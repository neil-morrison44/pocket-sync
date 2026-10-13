import { Suspense, useCallback, useEffect, useState } from "react"
import {
  PocketSyncConfigSelector,
  skipAlternateAssetsSelector,
} from "../../jotai/config/selectors"
import { useUpdateConfig } from "./hooks/useUpdateConfig"

import "./index.css"
import { reconnectWhenOpenedAtom } from "../../jotai/atoms"
import { invokeClearFileCache } from "../../utils/invokes"
import { useTranslation, Trans } from "react-i18next"
import { Thanks } from "./thanks"
import { PocketColour } from "../../types"
import {
  alwaysUseEnglishAtom,
  keepPlatformDataAtom,
  turboDownloadsAtom,
} from "../../jotai/settings/atoms"
import { Link } from "../link"
import { emit } from "@tauri-apps/api/event"
import { openLogDir } from "../../utils/openLogDir"
import { HiddenCores } from "./items/hiddenCores"
import { GithubToken } from "./items/githubToken"
import { GBPalettesConversion } from "./items/gbPalettes"
import { useSmoothedAtom, useSmoothedAtomValue } from "../../utils/jotai"
import { useAtom, useSetAtom } from "jotai"
import { cacheDirSizeSelector } from "../../jotai/selectors"
import Switch from "../ui/Switch"
import { SettingsNav } from "./nav"
import { useColourOptions } from "./colourOptions"
import {
  StylePreference,
  stylePreferenceAtom,
  ThemePreference,
  themePreferenceAtom,
} from "../../jotai/theme/atoms"
import StickySection from "../ui/StickySection"
import PathField from "../ui/PathField"
import { openFolder } from "../../utils/openFolder"

const DEFAULT_ARCHIVE_URL = "https://archive.org/download/openFPGA-Files"
import Button from "../ui/Button"
import Select, { SelectOption } from "../ui/Select"
import TextInput from "../ui/TextInput"

export const Settings = () => {
  const config = useSmoothedAtomValue(PocketSyncConfigSelector)
  const [archiveUrlInput, setArchiveUrl] = useState(config.archive_url || "")
  const [alwaysUseEnglish, setAlwaysUseEnglish] =
    useSmoothedAtom(alwaysUseEnglishAtom)
  const [turboDownloads, setTurboDownloads] =
    useSmoothedAtom(turboDownloadsAtom)
  const [keepPlatformData, setKeepPlatformData] =
    useSmoothedAtom(keepPlatformDataAtom)
  const skipAlternateAssets = useSmoothedAtomValue(skipAlternateAssetsSelector)
  const [reconnectWhenOpened, setReconnectWhenOpened] = useSmoothedAtom(
    reconnectWhenOpenedAtom
  )
  const refreshCacheSize = useSetAtom(cacheDirSizeSelector)

  const updateConfig = useUpdateConfig()
  const { t } = useTranslation("settings")
  const { t: tSaves } = useTranslation("saves")
  const colourOptions = useColourOptions()
  const [themePreference, setThemePreference] = useAtom(themePreferenceAtom)
  const [stylePreference, setStylePreference] = useAtom(stylePreferenceAtom)
  const onDisconnect = useCallback(
    () => emit("pocket-connection", { connetcted: false }),
    []
  )

  useEffect(() => {
    refreshCacheSize()
  }, [])

  return (
    <div className="settings">
      <SettingsNav />
      <Thanks />
      <div className="settings__items">
        <StickySection
          id="settings-section-display"
          title={t("section_titles.display")}
        >
          <div className="settings__row" id="settings-theme">
            <h3 className="settings__row-title">{t("theme.title")}</h3>

            <div className="settings__checkbox">
              <label htmlFor="settings-theme-select">{t("theme.label")}</label>

              <Select<ThemePreference>
                id="settings-theme-select"
                value={themePreference}
                onChange={setThemePreference}
                options={[
                  { value: "system", label: t("theme.system") },

                  { value: "dark", label: t("theme.dark") },

                  { value: "light", label: t("theme.light") },
                ]}
              />
            </div>

            <div className="settings__checkbox">
              <label htmlFor="settings-style-select">
                {t("theme.style_label")}
              </label>

              <Select<StylePreference>
                id="settings-style-select"
                value={stylePreference}
                onChange={setStylePreference}
                options={[
                  { value: "slanted", label: t("theme.style_slanted") },
                  { value: "modern", label: t("theme.style_modern") },
                ]}
              />
            </div>
          </div>

          <div className="settings__row" id="settings-3d_pocket">
            <h3 className="settings__row-title">{t("3d_pocket.title")}</h3>

            <div className="settings__checkbox">
              <label htmlFor="settings-body-colour">
                {t("3d_pocket.body_label")}
              </label>
              <Select
                id="settings-body-colour"
                value={config.colour}
                options={colourOptions}
                onChange={(value) => updateConfig("colour", value)}
              />
            </div>

            <div className="settings__checkbox">
              <label htmlFor="settings-button-colour">
                {t("3d_pocket.buttons_label")}
              </label>
              <Select<PocketColour | "match">
                id="settings-button-colour"
                value={config.button_colour ?? "match"}
                options={[
                  { value: "match", label: t("3d_pocket.match_body") },
                  ...colourOptions,
                ]}
                onChange={(value) =>
                  updateConfig(
                    "button_colour",
                    value === "match" ? undefined : value
                  )
                }
              />
            </div>
          </div>
          <div className="settings__row" id="settings-language">
            <h3 className="settings__row-title">{t("language.title")}</h3>

            <Switch
              className="settings__checkbox"
              label={t("language.checkbox")}
              value={alwaysUseEnglish.value}
              onChange={(checked) => setAlwaysUseEnglish({ value: checked })}
            />
          </div>
          <div className="settings__row" id="settings-hide_ai_score">
            <h3 className="settings__row-title">{t("hide_ai_score.title")}</h3>
            <div className="settings__ramble">{t("hide_ai_score.ramble")}</div>
            <Switch
              className="settings__checkbox"
              label={t("hide_ai_score.checkbox")}
              value={config.hide_ai_score ?? false}
              onChange={(checked) => updateConfig("hide_ai_score", checked)}
            />
          </div>
          <HiddenCores />
        </StickySection>

        <StickySection
          id="settings-section-downloads"
          title={t("section_titles.downloads")}
        >
          <div className="settings__row" id="settings-archive">
            <h3 className="settings__row-title">{t("archive.title")}</h3>
            <div className="settings__ramble">{t("archive.warning")}</div>
            <PathField
              value={DEFAULT_ARCHIVE_URL}
              copyLabel={t("archive.copy_url")}
              copiedLabel={t("archive.copied")}
            />
            <div className="settings__text-input-and-save">
              <TextInput
                className="settings__text-input"
                label={t("archive.title")}
                value={archiveUrlInput}
                onChange={setArchiveUrl}
              />
              <Button
                onClick={() => updateConfig("archive_url", archiveUrlInput)}
              >
                {t("archive.save")}
              </Button>
            </div>
          </div>
          <div className="settings__row" id="settings-turbo_downloads">
            <h3 className="settings__row-title">
              {t("turbo_downloads.title")}
            </h3>
            <div className="settings__ramble">
              <Trans i18nKey={"turbo_downloads.ramble"} t={t}>
                {"_"}
                <Link href="https://archive.org/donate">{"_"}</Link>
              </Trans>
            </div>
            <Switch
              className="settings__checkbox"
              label={t("turbo_downloads.checkbox")}
              value={turboDownloads.enabled}
              onChange={(checked) =>
                setTurboDownloads({
                  ...turboDownloads,
                  enabled: checked,
                })
              }
            />
          </div>
          <div className="settings__row" id="settings-alternate_skip">
            <h3 className="settings__row-title">{t("alternate_skip.title")}</h3>
            <div className="settings__ramble">
              {t("alternate_skip.ramble_1")}
            </div>
            <div
              className="settings__ramble"
              dangerouslySetInnerHTML={{ __html: t("alternate_skip.ramble_2") }}
            ></div>
            <Switch
              className="settings__checkbox"
              label={t("alternate_skip.checkbox")}
              value={skipAlternateAssets}
              onChange={(checked) =>
                updateConfig("skipAlternateAssets", checked)
              }
            />
          </div>
          <div className="settings__row" id="settings-keep_platform_data">
            <h3 className="settings__row-title">
              {t("keep_platform_data.title")}
            </h3>
            <div className="settings__ramble">
              {t("keep_platform_data.ramble")}
            </div>
            <Switch
              className="settings__checkbox"
              label={t("keep_platform_data.checkbox")}
              value={keepPlatformData.enabled}
              onChange={(checked) =>
                setKeepPlatformData({
                  ...keepPlatformData,
                  enabled: checked,
                })
              }
            />
          </div>
          <GithubToken />
        </StickySection>

        <StickySection
          id="settings-section-files"
          title={t("section_titles.files")}
        >
          <GBPalettesConversion />
          <div className="settings__row" id="settings-clear_file_cache">
            <h3 className="settings__row-title">
              {t("clear_file_cache.title")}
            </h3>
            <div className="settings__ramble">
              {t("clear_file_cache.ramble")}
            </div>

            <div className="settings__checkbox">
              <Suspense>
                <CacheSize />
              </Suspense>
              <Button
                theme="destructive"
                icon="trash"
                onClick={async () => {
                  await invokeClearFileCache()
                  refreshCacheSize()
                }}
              >
                {t("clear_file_cache.button")}
              </Button>
            </div>
          </div>
          <div className="settings__row" id="settings-logs">
            <h3 className="settings__row-title">{t("logs.title")}</h3>
            <div className="settings__actions">
              <Button icon="folder" onClick={() => openLogDir()}>
                {t("logs.button")}
              </Button>
            </div>
          </div>
        </StickySection>

        <StickySection
          id="settings-section-connection"
          title={t("section_titles.connection")}
        >
          <div className="settings__row" id="settings-reconnect">
            <h3 className="settings__row-title">{t("reconnect.title")}</h3>
            <div className="settings__ramble settings__ramble--collapse-spaces">
              {/* The translations embed the path; it's shown below in a
                  PathField instead, so it can't overflow the column */}
              <Trans t={t} i18nKey="reconnect.ramble" values={{ ppath: "" }}>
                {"_"}
                <Omit />
                {"_"}
              </Trans>
            </div>
            {reconnectWhenOpened.path && (
              <PathField
                className="settings__path"
                value={reconnectWhenOpened.path}
                copyLabel={tSaves("copy_path")}
                copiedLabel={tSaves("copied")}
                onOpen={() => openFolder(reconnectWhenOpened.path)}
                openLabel={tSaves("open_folder")}
              />
            )}
            <Switch
              className="settings__checkbox"
              label={t("reconnect.checkbox")}
              value={reconnectWhenOpened.enable}
              onChange={(checked) => {
                setReconnectWhenOpened({
                  ...reconnectWhenOpened,
                  enable: checked,
                })
              }}
            />
          </div>
          <div className="settings__row" id="settings-disconnect">
            <h3 className="settings__row-title">{t("disconnect.title")}</h3>
            <div className="settings__ramble">{t("disconnect.ramble")}</div>
            <div className="settings__actions">
              <Button onClick={() => onDisconnect()}>
                {t("disconnect.button")}
              </Button>
            </div>
          </div>
        </StickySection>
      </div>
    </div>
  )
}

/** Drops a `<Trans>` placeholder's content. */
const Omit = () => null

export const CacheSize = () => {
  const [cacheSize] = useAtom(cacheDirSizeSelector)
  return <div>{cacheSize}</div>
}
