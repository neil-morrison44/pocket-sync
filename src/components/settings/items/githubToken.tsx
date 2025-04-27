import { githubTokenAtom } from "../../../recoil/settings/atoms"
import { useTranslation } from "react-i18next"
import { useAtom } from "jotai"

export const GithubToken = () => {
  const { t } = useTranslation("settings")
  const [githubToken, setGithubToken] = useAtom(githubTokenAtom)

  return (
    <div className="settings__row">
      <h3 className="settings__row-title">{t("github_token.title")}</h3>
      <div className="settings__ramble">{t("github_token.ramble")}</div>
      <div className="settings__text-input-and-save">
        <input
          type="text"
          className="settings__text-input"
          value={githubToken.value || ""}
          onChange={({ target }) => setGithubToken({ value: target.value })}
        />
        <button onClick={() => setGithubToken({ value: null })}>
          {t("github_token.remove")}
        </button>
      </div>
    </div>
  )
}
