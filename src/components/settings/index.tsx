import { useState } from "react"
import { useRecoilState, useRecoilValue } from "recoil"
import {
  PocketSyncConfigSelector,
  skipAlternateAssetsSelector,
} from "../../recoil/config/selectors"
import { useUpdateConfig } from "./hooks/useUpdateConfig"

import "./index.css"
import { reconnectWhenOpenedAtom } from "../../recoil/atoms"
import { invokeClearFileCache } from "../../utils/invokes"
import { useTranslation, Trans } from "react-i18next"
import { useDisconnectPocket } from "../../hooks/useDisconnectPocket"
import { Thanks } from "./thanks"
import { PocketColour } from "../../types"
import { alwaysUseEnglishAtom } from "../../recoil/settings/atoms"

export const Settings = () => {
  const config = useRecoilValue(PocketSyncConfigSelector)
  const [archiveUrlInput, setArchiveUrl] = useState(config.archive_url || "")
  const [alwaysUseEnglish, setAlwaysUseEnglish] =
    useRecoilState(alwaysUseEnglishAtom)
  const skipAlternateAssets = useRecoilValue(skipAlternateAssetsSelector)
  const [reconnectWhenOpened, setReconnectWhenOpened] = useRecoilState(
    reconnectWhenOpenedAtom
  )
  const updateConfig = useUpdateConfig()
  const { t } = useTranslation("settings")
  const onDisconnect = useDisconnectPocket()

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
