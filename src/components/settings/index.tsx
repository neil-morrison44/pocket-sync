import { useCallback, useState } from "react"
import { useRecoilState, useRecoilValue } from "recoil"
import {
  PocketSyncConfigSelector,
  skipAlternateAssetsSelector,
} from "../../recoil/config/selectors"
import { useUpdateConfig } from "./hooks/useUpdateConfig"

import "./index.css"
import { reconnectWhenOpenedAtom } from "../../recoil/atoms"
import { invokeClearFileCache, invokePatreonKeys } from "../../utils/invokes"
import { useTranslation, Trans } from "react-i18next"
import { Thanks } from "./thanks"
import { PocketColour } from "../../types"
import {
  alwaysUseEnglishAtom,
  keepPlatformDataAtom,
  turboDownloadsAtom,
} from "../../recoil/settings/atoms"
import { Link } from "../link"
import { emit } from "@tauri-apps/api/event"
import { openLogDir } from "../../utils/openLogDir"
import { PatreonKeys } from "./patreonKeys"
import { patreonKeyListSelector } from "../../recoil/settings/selectors"

export const Settings = () => {
  const config = useRecoilValue(PocketSyncConfigSelector)
  const [archiveUrlInput, setArchiveUrl] = useState(config.archive_url || "")

  const [patreonEmailInput, setPatreonEmail] = useState(
    config.patreon_email || ""
  )
  const [alwaysUseEnglish, setAlwaysUseEnglish] =
    useRecoilState(alwaysUseEnglishAtom)

  const [turboDownloads, setTurboDownloads] = useRecoilState(turboDownloadsAtom)
  const [keepPlatformData, setKeepPlatformData] =
    useRecoilState(keepPlatformDataAtom)
  const skipAlternateAssets = useRecoilValue(skipAlternateAssetsSelector)
  const [reconnectWhenOpened, setReconnectWhenOpened] = useRecoilState(
    reconnectWhenOpenedAtom
  )
  const updateConfig = useUpdateConfig()
  const { t } = useTranslation("settings")
  const onDisconnect = useCallback(
    () => emit("pocket-connection", { connetcted: false }),
    []
  )

  const patreonUrls = useRecoilValue(patreonKeyListSelector)

  return (
    <div className="settings">
      <div className="settings__items">
        <div className="settings__row">
          <h3 className="settings__row-title">{t("3d_pocket.title")}</h3>

          <label className="settings__checkbox">
            {t("3d_pocket.body_label")}
            <select
              value={config.colour}
              onChange={({ target }) =>
                updateConfig("colour", target.value as PocketColour)
              }
            >
              <ColoursList />
            </select>
          </label>

          <label className="settings__checkbox">
            {t("3d_pocket.buttons_label")}
            <select
              value={config.button_colour ?? "match"}
              onChange={({ target }) => {
                if (target.value === "match") {
                  updateConfig("button_colour", undefined)
                } else {
                  updateConfig("button_colour", target.value as PocketColour)
                }
              }}
            >
              <option value={"match"}>{t("3d_pocket.match_body")}</option>
              <ColoursList />
            </select>
          </label>
        </div>

        <div className="settings__row">
          <h3 className="settings__row-title">{t("archive.title")}</h3>
          <div className="settings__ramble">{t("archive.warning")}</div>
          {/* eslint-disable-next-line react/jsx-no-literals */}
          <pre>{"https://archive.org/download/openFPGA-Files"}</pre>
          <div className="settings__text-input-and-save">
            <input
              type="text"
              className="settings__text-input"
              value={archiveUrlInput}
              onChange={({ target }) => setArchiveUrl(target.value)}
            />
            <button
              onClick={() => updateConfig("archive_url", archiveUrlInput)}
            >
              {t("archive.save")}
            </button>
          </div>
        </div>
        <div className="settings__row">
          <h3 className="settings__row-title">{t("patreon_keys.title")}</h3>
          <div className="settings__ramble">{t("patreon_keys.ramble")}</div>
          <div className="settings__text-input-and-save">
            <input
              type="text"
              className="settings__text-input"
              placeholder={t("patreon_keys.placeholder")}
              value={patreonEmailInput}
              onChange={({ target }) => setPatreonEmail(target.value)}
            />
            <button
              onClick={() => {
                updateConfig("patreon_email", patreonEmailInput)

                invokePatreonKeys(
                  patreonEmailInput,
                  patreonUrls.map(({ url, id }) => ({ url, id }))
                )
              }}
            >
              {t("patreon_keys.update")}
            </button>
          </div>
          <PatreonKeys />
        </div>
        <div className="settings__row">
          <h3 className="settings__row-title">{t("turbo_downloads.title")}</h3>
          <div className="settings__ramble">
            <Trans i18nKey={"turbo_downloads.ramble"} t={t}>
              {"_"}
              <Link href="https://archive.org/donate">{"_"}</Link>
            </Trans>
          </div>
          <label className="settings__checkbox">
            {t("turbo_downloads.checkbox")}
            <input
              type="checkbox"
              checked={turboDownloads.enabled}
              onChange={({ target }) =>
                setTurboDownloads((t) => ({ ...t, enabled: target.checked }))
              }
            />
          </label>
        </div>

        <div className="settings__row">
          <h3 className="settings__row-title">
            {t("keep_platform_data.title")}
          </h3>
          <div className="settings__ramble">
            {t("keep_platform_data.ramble")}
          </div>
          <label className="settings__checkbox">
            {t("keep_platform_data.checkbox")}
            <input
              type="checkbox"
              checked={keepPlatformData.enabled}
              onChange={({ target }) =>
                setKeepPlatformData((t) => ({ ...t, enabled: target.checked }))
              }
            />
          </label>
        </div>

        <div className="settings__row">
          <h3 className="settings__row-title">{t("language.title")}</h3>

          <label className="settings__checkbox">
            {t("language.checkbox")}
            <input
              type="checkbox"
              checked={alwaysUseEnglish.value}
              onChange={({ target }) =>
                setAlwaysUseEnglish({ value: target.checked })
              }
            />
          </label>
        </div>

        <div className="settings__row">
          <h3 className="settings__row-title">{t("alternate_skip.title")}</h3>
          <div className="settings__ramble">{t("alternate_skip.ramble_1")}</div>
          <div
            className="settings__ramble"
            dangerouslySetInnerHTML={{ __html: t("alternate_skip.ramble_2") }}
          ></div>
          <label className="settings__checkbox">
            {t("alternate_skip.checkbox")}
            <input
              type="checkbox"
              checked={skipAlternateAssets}
              onChange={({ target }) =>
                updateConfig("skipAlternateAssets", target.checked)
              }
            />
          </label>
        </div>

        <div className="settings__row">
          <h3 className="settings__row-title">{t("reconnect.title")}</h3>
          <div className="settings__ramble">
            <Trans
              t={t}
              i18nKey="reconnect.ramble"
              values={{ ppath: reconnectWhenOpened.path }}
            >
              {"_"}
              <pre>{"_"}</pre>
              {"_"}
            </Trans>
          </div>
          <label className="settings__checkbox">
            {t("reconnect.checkbox")}
            <input
              type="checkbox"
              checked={reconnectWhenOpened.enable}
              onChange={({ target }) => {
                setReconnectWhenOpened((r) => ({
                  ...r,
                  enable: target.checked,
                }))
              }}
            />
          </label>
        </div>

        <div className="settings__row">
          <h3 className="settings__row-title">{t("clear_file_cache.title")}</h3>
          <div className="settings__ramble">{t("clear_file_cache.ramble")}</div>
          <label className="settings__checkbox">
            <button onClick={() => invokeClearFileCache()}>
              {t("clear_file_cache.button")}
            </button>
          </label>
        </div>

        <div className="settings__row">
          <h3 className="settings__row-title">{t("disconnect.title")}</h3>
          <div className="settings__ramble">{t("disconnect.ramble")}</div>
          <label className="settings__checkbox">
            <button onClick={() => onDisconnect()}>
              {t("disconnect.button")}
            </button>
          </label>
        </div>

        <div className="settings__row">
          <h3 className="settings__row-title">{t("logs.title")}</h3>
          <label className="settings__checkbox">
            <button onClick={() => openLogDir()}>{t("logs.button")}</button>
          </label>
        </div>
      </div>

      <Thanks />
    </div>
  )
}

type OptionsListProps = {
  values: string[]
  i18nPrefix: string
}

const OptionsList = ({ values, i18nPrefix }: OptionsListProps) => {
  const { t } = useTranslation("settings")
  return values.map((value) => (
    <option key={value} value={value}>
      {t(`${i18nPrefix}.${value}`)}
    </option>
  ))
}

const ColoursList = () => {
  const { t } = useTranslation("settings")

  return (
    <>
      <OptionsList
        values={["black", "white", "glow"]}
        i18nPrefix="3d_pocket.colours"
      />
      <optgroup label={t("3d_pocket.transparent_label")}>
        <OptionsList
          values={[
            "trans_clear",
            "trans_smoke",
            "trans_blue",
            "trans_green",
            "trans_orange",
            "trans_purple",
            "trans_red",
          ]}
          i18nPrefix="3d_pocket.colours"
        />
      </optgroup>
      <optgroup label={t("3d_pocket.classic_label")}>
        <OptionsList
          values={[
            "indigo",
            "red",
            "green",
            "blue",
            "yellow",
            "pink",
            "orange",
            "silver",
          ]}
          i18nPrefix="3d_pocket.colours"
        />
      </optgroup>
      <optgroup label={t("3d_pocket.aluminium_label")}>
        <OptionsList
          values={[
            "aluminium_natural",
            "aluminium_noir",
            "aluminium_black",
            "aluminium_indigo",
          ]}
          i18nPrefix="3d_pocket.colours"
        />
      </optgroup>
      <optgroup label={t("3d_pocket.gbc_label")}>
        <OptionsList
          values={[
            "gbc_kiwi",
            "gbc_dandelion",
            "gbc_teal",
            "gbc_grape",
            "gbc_berry",
            "gbc_gold",
          ]}
          i18nPrefix="3d_pocket.colours"
        />
      </optgroup>
    </>
  )
}
